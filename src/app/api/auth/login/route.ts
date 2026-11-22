import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';
import { setSessionCookie } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.email || body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const rememberMe = Boolean(body.rememberMe);

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/username dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: identifier.includes('@')
        ? { email: identifier }
        : { OR: [{ username: identifier }, { email: identifier }] },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Email atau kata sandi tidak valid.' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Email atau kata sandi tidak valid.' },
        { status: 401 }
      );
    }

    await setSessionCookie(user.id, { rememberMe });

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
        email: user.email,
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
