import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body?.token || '').trim();
    const newPassword = String(body?.newPassword || '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token reset kata sandi wajib disertakan.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Kata sandi baru minimal 8 karakter.' },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, isActive: true },
        },
      },
    });

    if (
      !resetRecord ||
      resetRecord.usedAt !== null ||
      resetRecord.expiresAt.getTime() < Date.now() ||
      !resetRecord.user.isActive
    ) {
      return NextResponse.json(
        { error: 'Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: resetRecord.userId,
          action: 'PASSWORD_RESET',
          entityType: 'User',
          entityId: resetRecord.userId,
          metadataJson: JSON.stringify({ tokenId: resetRecord.id }),
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: 'Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat mengatur ulang kata sandi.' },
      { status: 500 }
    );
  }
}
