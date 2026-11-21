import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { serializePatientWithEncounter } from '../../../lib/serializers';

async function getNextQueueNumber(visitDate: string): Promise<string> {
  const todayEncounters = await prisma.encounter.findMany({
    where: { visitDate },
    select: { queueNumber: true },
  });
  const maxQueue = todayEncounters.reduce((max, e) => {
    const num = parseInt(e.queueNumber.replace(/[^0-9]/g, ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  return `A-${String(maxQueue + 1).padStart(2, '0')}`;
}

async function getNextRmNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.patient.count();
  let candidate = count + 1;
  while (true) {
    const rmNumber = `RM-${year}${String(candidate).padStart(4, '0')}`;
    const exists = await prisma.patient.findUnique({ where: { rmNumber }, select: { id: true } });
    if (!exists) return rmNumber;
    candidate++;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');

  // Mode Display TV publik: hanya kembalikan data antrean non-sensitif
  if (view === 'tv') {
    const patients = await prisma.patient.findMany({
      include: {
        encounters: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const queue = patients
      .filter((p) => p.encounters.length > 0)
      .map((p) => ({
        id: p.id,
        encounterId: p.encounters[0].id,
        queueNumber: p.encounters[0].queueNumber,
        name: p.name,
        rmNumber: p.rmNumber,
        age: p.age,
        statusKunjungan: p.encounters[0].statusKunjungan,
      }));

    return NextResponse.json({ patients: queue });
  }

  const { errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN', 'KASIR']);
  if (errorResponse) return errorResponse;

  const patients = await prisma.patient.findMany({
    include: {
      encounters: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          odontogram: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = patients.map(serializePatientWithEncounter);
  const today = new Date().toISOString().slice(0, 10);
  const nextQueueNumber = await getNextQueueNumber(today);
  const nextRmNumber = await getNextRmNumber();

  return NextResponse.json({
    patients: serialized,
    meta: { nextQueueNumber, nextRmNumber },
  });
}

export async function POST(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const age = Number(body.age);

    if (!name || !phone || isNaN(age)) {
      return NextResponse.json(
        { error: 'Nama lengkap, nomor HP, dan usia pasien wajib diisi.' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const rmNumber = await getNextRmNumber();
    const queueNumber = await getNextQueueNumber(today);
    const registeredBy = `${user.name} (${user.roleLabel || user.role})`;

    const doctor = await prisma.user.findFirst({
      where: { role: 'DOKTER', isActive: true },
      select: { id: true },
    });

    const created = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          rmNumber,
          nik: String(body.nik || '').trim() || null,
          name,
          birthDate: body.birthDate ? String(body.birthDate) : null,
          age,
          gender: body.gender === 'Laki-laki' ? 'Laki-laki' : 'Perempuan',
          phone,
          address: String(body.address || '').trim(),
          allergies: String(body.allergies || 'Tidak Ada').trim() || 'Tidak Ada',
          registeredBy,
        },
      });

      const encounter = await tx.encounter.create({
        data: {
          patientId: patient.id,
          doctorId: doctor?.id ?? null,
          visitDate: today,
          queueNumber,
          statusKunjungan: 'Menunggu',
          subjective: String(body.complaint || '').trim() || 'Pemeriksaan rutin kesehatan gigi & mulut.',
          objective: 'Pemeriksaan intraoral awal saat registrasi.',
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
          dentitionType: age <= 12 ? 'mixed' : 'adult',
          teethJson: '{}',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_PATIENT',
          entityType: 'Patient',
          entityId: patient.id,
          metadataJson: JSON.stringify({ rmNumber, queueNumber }),
        },
      });

      return { ...patient, encounters: [{ ...encounter, odontogram }] };
    });

    return NextResponse.json(
      { patient: serializePatientWithEncounter(created) },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/patients error:', err);
    return NextResponse.json({ error: 'Gagal mendaftarkan pasien baru.' }, { status: 500 });
  }
}
