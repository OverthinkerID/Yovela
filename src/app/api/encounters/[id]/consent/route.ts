import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAuth(['DOKTER', 'DOKTER_LAIN', 'PENDAFTARAN']);
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  const encounter = await prisma.encounter.findUnique({
    where: { id },
    select: {
      id: true,
      consentSigned: true,
      consentSignerName: true,
      consentProcedure: true,
      consentSignatureData: true,
      consentSignedAt: true,
    },
  });

  if (!encounter) {
    return NextResponse.json({ error: 'Kunjungan tidak ditemukan.' }, { status: 404 });
  }

  return NextResponse.json({ consent: encounter });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'DOKTER_LAIN']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const signerName = String(body.signerName || '').trim();
    const procedure = String(body.procedure || '').trim();
    const signatureData = String(body.signatureData || '').trim();

    if (!signerName || !signatureData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Nama penanda tangan dan tanda tangan digital wajib diisi.' },
        { status: 400 }
      );
    }

    const updated = await prisma.encounter.update({
      where: { id },
      data: {
        consentSigned: true,
        consentSignerName: signerName,
        consentProcedure: procedure || 'Tindakan Kedokteran Gigi',
        consentSignatureData: signatureData,
        consentSignedAt: new Date(),
      },
      select: {
        id: true,
        consentSigned: true,
        consentSignerName: true,
        consentProcedure: true,
        consentSignatureData: true,
        consentSignedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SIGN_INFORMED_CONSENT',
        entityType: 'Encounter',
        entityId: id,
        metadataJson: JSON.stringify({ signerName, procedure }),
      },
    });

    return NextResponse.json({ consent: updated });
  } catch (err) {
    console.error('POST /api/encounters/[id]/consent error:', err);
    return NextResponse.json({ error: 'Gagal menyimpan Informed Consent.' }, { status: 500 });
  }
}
