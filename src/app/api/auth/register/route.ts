import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const rawUsername = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const tokenCode = String(body.registrationToken || '').trim().toUpperCase();

    if (!name || !email || !password || !tokenCode) {
      return NextResponse.json(
        { error: 'Nama lengkap, email, kata sandi, dan token registrasi wajib diisi.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Kata sandi minimal 8 karakter.' },
        { status: 400 }
      );
    }

    const tokenRecord = await prisma.registrationToken.findUnique({
      where: { code: tokenCode },
    });

    if (!tokenRecord || !tokenRecord.isActive) {
      return NextResponse.json(
        { error: 'Token registrasi tidak valid atau sudah dinonaktifkan.' },
        { status: 403 }
      );
    }

    if (tokenRecord.expiresAt && tokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token registrasi sudah kedaluwarsa. Hubungi Administrator Klinik.' },
        { status: 403 }
      );
    }

    if (tokenRecord.usedCount >= tokenRecord.maxUses) {
      return NextResponse.json(
        { error: 'Kuota penggunaan token registrasi ini sudah habis.' },
        { status: 403 }
      );
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.' },
        { status: 409 }
      );
    }

    let username = rawUsername || email.split('@')[0].replace(/[^a-z0-9._-]/g, '');
    if (!username) username = `staf${Date.now().toString().slice(-5)}`;
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      username = `${username}_${Date.now().toString().slice(-4)}`;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          username,
          passwordHash,
          role: tokenRecord.role,
          roleLabel: tokenRecord.roleLabel,
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          roleLabel: true,
        },
      });

      await tx.registrationToken.update({
        where: { id: tokenRecord.id },
        data: { usedCount: { increment: 1 } },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER_WITH_TOKEN',
          entityType: 'User',
          entityId: user.id,
          metadataJson: JSON.stringify({ tokenCode, assignedRole: tokenRecord.role }),
        },
      });

      return user;
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    console.error('Register API error:', err);
    return NextResponse.json({ error: 'Gagal mendaftarkan akun baru.' }, { status: 500 });
  }
}
