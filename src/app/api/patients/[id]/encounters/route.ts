import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN', 'KASIR']);
  if (errorResponse) return errorResponse;

  try {
    const { id: patientId } = await context.params;
    const encounters = await prisma.encounter.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { select: { name: true, roleLabel: true } },
        odontogram: true,
        invoice: {
          select: {
            invoiceNo: true,
            amount: true,
            paymentMethod: true,
            paidAt: true,
          },
        },
      },
    });

    const formatted = encounters.map((enc) => {
      let suggestedTreatments: string[] = [];
      try {
        const parsed = JSON.parse(enc.suggestedTreatmentsJson || '[]');
        if (Array.isArray(parsed)) suggestedTreatments = parsed;
      } catch {}

      let odontogram: Record<number, any> = {};
      try {
        odontogram = JSON.parse(enc.odontogram?.teethJson || '{}');
      } catch {}

      return {
        id: enc.id,
        visitDate: enc.visitDate,
        queueNumber: enc.queueNumber,
        statusKunjungan: enc.statusKunjungan,
        doctorName: enc.doctor?.name || 'drg. Yuli Kartilla Panjaitan',
        subjective: enc.subjective,
        objective: enc.objective,
        diagnosisIcd10: enc.diagnosisIcd10,
        suggestedTreatments,
        prescriptionNotes: enc.prescriptionNotes,
        odontogram,
        dentitionType: enc.odontogram?.dentitionType || 'adult',
        dmft: {
          d: enc.odontogram?.dmftD || 0,
          m: enc.odontogram?.dmftM || 0,
          f: enc.odontogram?.dmftF || 0,
          total:
            (enc.odontogram?.dmftD || 0) +
            (enc.odontogram?.dmftM || 0) +
            (enc.odontogram?.dmftF || 0),
        },
        invoice: enc.invoice,
        createdAt: enc.createdAt,
      };
    });

    return NextResponse.json({ encounters: formatted });
  } catch (err) {
    console.error('GET /api/patients/[id]/encounters error:', err);
    return NextResponse.json({ error: 'Gagal memuat riwayat kunjungan pasien.' }, { status: 500 });
  }
}
