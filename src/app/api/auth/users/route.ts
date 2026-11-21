import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export async function GET() {
  const { errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      roleLabel: true,
      sipNumber: true,
      isActive: true,
    },
  });

  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const updates = Array.isArray(body.users) ? body.users : [];

    for (const item of updates) {
      if (!item.id) continue;
      const data: Record<string, any> = {};
      if (typeof item.name === 'string' && item.name.trim()) {
        data.name = item.name.trim();
      }
      if (typeof item.username === 'string' && item.username.trim()) {
        data.username = item.username.trim().toLowerCase();
      }
      if (typeof item.newPassword === 'string' && item.newPassword.trim().length >= 6) {
        data.passwordHash = await bcrypt.hash(item.newPassword.trim(), 10);
      }

      if (Object.keys(data).length > 0) {
        await prisma.user.update({
          where: { id: item.id },
          data,
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_USERS',
        entityType: 'User',
        entityId: user.id,
      },
    });

    const refreshed = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        roleLabel: true,
        sipNumber: true,
        isActive: true,
      },
    });

    return NextResponse.json({ users: refreshed });
  } catch (err) {
    console.error('Update users API error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui data akun staf.' }, { status: 500 });
  }
}
