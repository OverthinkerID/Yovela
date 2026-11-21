import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN']);
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  const media = await prisma.clinicalMedia.findMany({
    where: { encounterId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ media });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const { id: encounterId } = await context.params;
    const body = await request.json();
    const mediaType = String(body.mediaType || 'INTRAORAL').toUpperCase();
    const caption = String(body.caption || '').trim();
    const fileName = String(body.fileName || 'foto-klinis.jpg').trim();
    const mimeType = String(body.mimeType || 'image/jpeg').trim();
    const dataUrl = String(body.dataUrl || '').trim();

    if (!dataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Format file tidak valid. Harap unggah gambar (JPG/PNG/WebP).' },
        { status: 400 }
      );
    }

    // Batas wajar 5 MB untuk base64 data URL
    if (dataUrl.length > 7_000_000) {
      return NextResponse.json(
        { error: 'Ukuran gambar terlalu besar (maksimal ~5MB).' },
        { status: 413 }
      );
    }

    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      select: { id: true, patientId: true },
    });

    if (!encounter) {
      return NextResponse.json({ error: 'Kunjungan tidak ditemukan.' }, { status: 404 });
    }

    const created = await prisma.clinicalMedia.create({
      data: {
        encounterId: encounter.id,
        patientId: encounter.patientId,
        mediaType,
        caption,
        fileName,
        mimeType,
        dataUrl,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPLOAD_CLINICAL_MEDIA',
        entityType: 'ClinicalMedia',
        entityId: created.id,
        metadataJson: JSON.stringify({ encounterId, mediaType, fileName }),
      },
    });

    return NextResponse.json({ media: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/encounters/[id]/media error:', err);
    return NextResponse.json({ error: 'Gagal mengunggah foto klinis.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const { id: encounterId } = await context.params;
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId wajib disertakan.' }, { status: 400 });
    }

    await prisma.clinicalMedia.deleteMany({
      where: { id: mediaId, encounterId },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_CLINICAL_MEDIA',
        entityType: 'ClinicalMedia',
        entityId: mediaId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/encounters/[id]/media error:', err);
    return NextResponse.json({ error: 'Gagal menghapus foto klinis.' }, { status: 500 });
  }
}
