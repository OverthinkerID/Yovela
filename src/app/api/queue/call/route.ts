import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

// GET publik untuk Display TV ruang tunggu (tanpa data medis sensitif)
export async function GET() {
  const latest = await prisma.queueCall.findFirst({
    orderBy: { calledAt: 'desc' },
  });

  return NextResponse.json({ call: latest });
}

// POST untuk memanggil pasien dari resepsionis/poli ke semua Display TV
export async function POST(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const queueNumber = String(body.queueNumber || '').trim();
    const patientName = String(body.patientName || '').trim();
    const roomName = String(body.roomName || 'Ruang Tindakan 01').trim();
    const doctorName = String(body.doctorName || 'drg. Yuli Kartilla Panjaitan').trim();

    if (!queueNumber || !patientName) {
      return NextResponse.json(
        { error: 'Nomor antrean dan nama pasien wajib diisi.' },
        { status: 400 }
      );
    }

    const created = await prisma.queueCall.create({
      data: {
        queueNumber,
        patientName,
        roomName,
        doctorName,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CALL_QUEUE_TV',
        entityType: 'QueueCall',
        entityId: created.id,
        metadataJson: JSON.stringify({ queueNumber, patientName, roomName }),
      },
    });

    return NextResponse.json({ call: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/queue/call error:', err);
    return NextResponse.json({ error: 'Gagal mengirim panggilan ke Display TV.' }, { status: 500 });
  }
}
