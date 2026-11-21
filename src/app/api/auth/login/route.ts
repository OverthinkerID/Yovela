import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';
import { setSessionCookie } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Username atau kata sandi tidak cocok!' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Username atau kata sandi tidak cocok!' },
        { status: 401 }
      );
    }

    await setSessionCookie(user.id);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        roleLabel: user.roleLabel,
        sipNumber: user.sipNumber,
      },
    });
  } catch (err) {
    console.error('Login API error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan saat memproses login.' }, { status: 500 });
  }
}
