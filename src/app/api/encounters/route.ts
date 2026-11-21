import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { serializePatientWithEncounter } from '../../../lib/serializers';

export async function POST(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const patientId = String(body.patientId || '').trim();
    if (!patientId) {
      return NextResponse.json({ error: 'patientId wajib diisi.' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        odontograms: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Data pasien tidak ditemukan.' }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const todayEncounters = await prisma.encounter.findMany({
      where: { visitDate: today },
      select: { queueNumber: true },
    });
    const maxQueue = todayEncounters.reduce((max, e) => {
      const num = parseInt(e.queueNumber.replace(/[^0-9]/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const queueNumber = `A-${String(maxQueue + 1).padStart(2, '0')}`;
    const registeredBy = `${user.name} (${user.roleLabel || user.role})`;

    const doctor = await prisma.user.findFirst({
      where: { role: 'DOKTER', isActive: true },
      select: { id: true },
    });

    const latestTeethJson = patient.odontograms[0]?.teethJson || '{}';

    const result = await prisma.$transaction(async (tx) => {
      const encounter = await tx.encounter.create({
        data: {
          patientId: patient.id,
          doctorId: doctor?.id ?? null,
          visitDate: today,
          queueNumber,
          statusKunjungan: 'Menunggu',
          subjective: String(body.complaint || '').trim() || 'Kontrol / kunjungan ulang pasien.',
          objective: '',
          diagnosisIcd10: 'K02.1',
          suggestedTreatmentsJson: JSON.stringify(['TRT-001']),
          prescriptionNotes: '',
          registeredBy,
        },
      });

      const odontogram = await tx.odontogramRecord.create({
        data: {
          encounterId: encounter.id,
          patientId: patient.id,
          dentitionType: patient.age <= 12 ? 'mixed' : 'adult',
          teethJson: latestTeethJson,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'REQUEUE_PATIENT',
          entityType: 'Encounter',
          entityId: encounter.id,
          metadataJson: JSON.stringify({ patientId: patient.id, queueNumber }),
        },
      });

      return { ...patient, encounters: [{ ...encounter, odontogram }] };
    });

    return NextResponse.json(
      { patient: serializePatientWithEncounter(result) },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/encounters error:', err);
    return NextResponse.json({ error: 'Gagal membuat antrean kunjungan baru.' }, { status: 500 });
  }
}
