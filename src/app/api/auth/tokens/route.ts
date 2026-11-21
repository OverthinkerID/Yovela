import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, UserRole } from '../../../../lib/auth';

const ROLE_LABELS: Record<UserRole, string> = {
  DOKTER: 'Dokter Gigi Umum',
  PENDAFTARAN: 'Perawat Gigi & Front Office',
  KASIR: 'Admin Pembayaran & Kasir',
};

const ROLE_PREFIX: Record<UserRole, string> = {
  DOKTER: 'DRG',
  PENDAFTARAN: 'PRW',
  KASIR: 'KSR',
};

export async function GET() {
  const { errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  const tokens = await prisma.registrationToken.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ tokens });
}

export async function POST(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const role = String(body.role || 'PENDAFTARAN') as UserRole;
    if (!['DOKTER', 'PENDAFTARAN', 'KASIR'].includes(role)) {
      return NextResponse.json({ error: 'Peran token tidak valid.' }, { status: 400 });
    }

    const maxUses = Math.max(1, Math.min(100, Number(body.maxUses) || 5));
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `YOVELA-${ROLE_PREFIX[role]}-${rand}`;

    const created = await prisma.registrationToken.create({
      data: {
        code,
        role,
        roleLabel: ROLE_LABELS[role],
        maxUses,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_REG_TOKEN',
        entityType: 'RegistrationToken',
        entityId: created.id,
        metadataJson: JSON.stringify({ code, role, maxUses }),
      },
    });

    return NextResponse.json({ token: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/auth/tokens error:', err);
    return NextResponse.json({ error: 'Gagal membuat token registrasi.' }, { status: 500 });
  }
}
