import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

export async function GET() {
  const { errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  const logs = await prisma.satuSehatSyncLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const formatted = logs.map((l) => ({
    id: l.id,
    timestamp: new Date(l.createdAt).toLocaleTimeString('id-ID'),
    patientName: l.patientName,
    nik: l.nik,
    resourceType: l.resourceType,
    resourceId: l.resourceId,
    status: l.status,
    rawPayload: (() => {
      try {
        return JSON.parse(l.rawPayloadJson);
      } catch {
        return {};
      }
    })(),
  }));

  return NextResponse.json({ logs: formatted });
}

export async function POST(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const encounterId = String(body.encounterId || '').trim();
    if (!encounterId) {
      return NextResponse.json({ error: 'encounterId wajib diisi.' }, { status: 400 });
    }

    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: { patient: true },
    });

    if (!encounter) {
      return NextResponse.json({ error: 'Kunjungan tidak ditemukan.' }, { status: 404 });
    }

    const resourceId = `bundle-${encounter.patient.rmNumber.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const payload = {
      patient: encounter.patient.name,
      nik: encounter.patient.nik || '',
      icd10: encounter.diagnosisIcd10,
      ihsStatus: 'Simulated Local Bridge',
    };

    const created = await prisma.satuSehatSyncLog.create({
      data: {
        encounterId: encounter.id,
        patientName: encounter.patient.name,
        nik: encounter.patient.nik || '-',
        resourceType: 'Bundle',
        resourceId,
        status: '201 Created',
        rawPayloadJson: JSON.stringify(payload),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SATUSEHAT_SYNC',
        entityType: 'Encounter',
        entityId: encounter.id,
        metadataJson: JSON.stringify({ resourceId }),
      },
    });

    return NextResponse.json(
      {
        log: {
          id: created.id,
          timestamp: new Date(created.createdAt).toLocaleTimeString('id-ID'),
          patientName: created.patientName,
          nik: created.nik,
          resourceType: created.resourceType,
          resourceId: created.resourceId,
          status: created.status,
          rawPayload: payload,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/satusehat error:', err);
    return NextResponse.json({ error: 'Gagal mencatat log sinkronisasi SATUSEHAT.' }, { status: 500 });
  }
}
