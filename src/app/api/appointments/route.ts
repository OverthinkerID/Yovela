import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

export async function GET(request: Request) {
  const { errorResponse } = await requireAuth(['DOKTER', 'DOKTER_LAIN', 'PENDAFTARAN', 'KASIR']);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const status = searchParams.get('status');

  const where: Record<string, any> = {};
  if (date) where.scheduledDate = date;
  if (status && status !== 'ALL') where.status = status;

  const [appointments, doctors] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, name: true, rmNumber: true, phone: true, age: true, gender: true },
        },
        doctor: {
          select: { id: true, name: true, roleLabel: true },
        },
      },
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
    }),
    prisma.user.findMany({
      where: { role: 'DOKTER', isActive: true },
      select: { id: true, name: true, roleLabel: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return NextResponse.json({ appointments, doctors });
}

export async function POST(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'DOKTER_LAIN', 'PENDAFTARAN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const patientId = String(body.patientId || '').trim();
    const scheduledDate = String(body.scheduledDate || '').trim();
    const scheduledTime = String(body.scheduledTime || '').trim();
    const durationMin = Number(body.durationMin) || 30;
    const chiefComplaint = String(body.chiefComplaint || '').trim();
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!patientId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Pasien, tanggal, dan jam janji temu wajib diisi.' },
        { status: 400 }
      );
    }

    let doctorId: string | null = body.doctorId ? String(body.doctorId) : null;
    if (!doctorId) {
      const defaultDoc = await prisma.user.findFirst({
        where: { role: 'DOKTER', isActive: true },
        select: { id: true },
      });
      doctorId = defaultDoc?.id ?? null;
    }

    // Cek bentrok jadwal dokter pada tanggal & jam yang sama
    if (doctorId) {
      const conflict = await prisma.appointment.findFirst({
        where: {
          doctorId,
          scheduledDate,
          scheduledTime,
          status: { in: ['BOOKED', 'CONFIRMED', 'ARRIVED'] },
        },
        include: { patient: { select: { name: true } } },
      });
      if (conflict) {
        return NextResponse.json(
          {
            error: `Jadwal bentrok: slot ${scheduledDate} pukul ${scheduledTime} sudah dipesan oleh ${conflict.patient.name}.`,
          },
          { status: 409 }
        );
      }
    }

    const created = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        scheduledDate,
        scheduledTime,
        durationMin,
        chiefComplaint: chiefComplaint || 'Konsultasi & pemeriksaan gigi terjadwal',
        notes,
        status: 'BOOKED',
      },
      include: {
        patient: {
          select: { id: true, name: true, rmNumber: true, phone: true, age: true, gender: true },
        },
        doctor: {
          select: { id: true, name: true, roleLabel: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_APPOINTMENT',
        entityType: 'Appointment',
        entityId: created.id,
        metadataJson: JSON.stringify({ patientId, scheduledDate, scheduledTime }),
      },
    });

    return NextResponse.json({ appointment: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/appointments error:', err);
    return NextResponse.json({ error: 'Gagal membuat jadwal janji temu.' }, { status: 500 });
  }
}
