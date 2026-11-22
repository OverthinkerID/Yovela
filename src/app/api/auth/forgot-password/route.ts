import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mailer';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 menit
const GENERIC_MESSAGE =
  'Jika email terdaftar dan aktif, instruksi reset kata sandi telah disiapkan.';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Masukkan alamat email yang valid.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true, name: true, email: true, isActive: true },
    });

    let devResetPath: string | undefined;

    if (user && user.isActive && user.email) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await prisma.$transaction([
        prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        }),
        prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'PASSWORD_RESET_REQUESTED',
            entityType: 'User',
            entityId: user.id,
            metadataJson: JSON.stringify({ expiresAt: expiresAt.toISOString() }),
          },
        }),
      ]);

      const resetPath = `/reset-password?token=${rawToken}`;
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
      await sendPasswordResetEmail({
        to: user.email,
        recipientName: user.name,
        resetUrl: `${baseUrl}${resetPath}`,
      });

      const isLocalDev =
        process.env.NODE_ENV !== 'production' &&
        process.env.VERCEL !== '1' &&
        !process.env.VERCEL_ENV;

      if (isLocalDev) {
        devResetPath = resetPath;
      }
    }

    return NextResponse.json({
      ok: true,
      message: GENERIC_MESSAGE,
      ...(devResetPath ? { devResetPath } : {}),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses permintaan reset kata sandi.' },
      { status: 500 }
    );
  }
}
