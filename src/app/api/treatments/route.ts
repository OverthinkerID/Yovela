import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

export async function GET() {
  const { errorResponse } = await requireAuth(['DOKTER', 'DOKTER_LAIN', 'PENDAFTARAN', 'KASIR']);
  if (errorResponse) return errorResponse;

  const treatments = await prisma.treatment.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json({ treatments });
}

export async function POST(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const category = String(body.category || 'Pemeriksaan & Preventif').trim();
    const icd9cm = String(body.icd9cm || '89.31').trim();
    const price = Math.max(0, Math.round(Number(body.price || 0)));
    const description = body.description ? String(body.description).trim() : null;

    if (!name || price <= 0) {
      return NextResponse.json(
        { error: 'Nama tindakan dan tarif (lebih dari Rp 0) wajib diisi.' },
        { status: 400 }
      );
    }

    const all = await prisma.treatment.findMany({ select: { id: true } });
    const maxNum = all.reduce((max, t) => {
      const n = parseInt(t.id.replace(/[^0-9]/g, ''), 10);
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    const id = `TRT-${String(maxNum + 1).padStart(3, '0')}`;

    const created = await prisma.treatment.create({
      data: {
        id,
        category,
        name,
        price,
        icd9cm,
        description,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_TREATMENT',
        entityType: 'Treatment',
        entityId: created.id,
        metadataJson: JSON.stringify({ name, price }),
      },
    });

    return NextResponse.json({ treatment: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/treatments error:', err);
    return NextResponse.json({ error: 'Gagal menambahkan tindakan baru.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const id = String(body.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'ID tindakan wajib diisi.' }, { status: 400 });
    }

    const data: Record<string, any> = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.category === 'string' && body.category.trim()) data.category = body.category.trim();
    if (typeof body.icd9cm === 'string' && body.icd9cm.trim()) data.icd9cm = body.icd9cm.trim();
    if (body.price !== undefined && !isNaN(Number(body.price))) {
      data.price = Math.max(0, Math.round(Number(body.price)));
    }
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

    const updated = await prisma.treatment.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_TREATMENT',
        entityType: 'Treatment',
        entityId: id,
        metadataJson: JSON.stringify(data),
      },
    });

    return NextResponse.json({ treatment: updated });
  } catch (err) {
    console.error('PATCH /api/treatments error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui tarif tindakan.' }, { status: 500 });
  }
}
