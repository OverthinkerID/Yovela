import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'DOKTER_LAIN', 'PENDAFTARAN']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            odontograms: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Jadwal janji temu tidak ditemukan.' }, { status: 404 });
    }

    const nextStatus = typeof body.status === 'string' ? body.status : existing.status;
    const reminderSent =
      typeof body.reminderSent === 'boolean' ? body.reminderSent : existing.reminderSent;
    const checkInToQueue = Boolean(body.checkInToQueue);

    const result = await prisma.$transaction(async (tx) => {
      const updatedAppt = await tx.appointment.update({
        where: { id },
        data: {
          status: nextStatus,
          reminderSent,
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

      let createdQueueNumber: string | null = null;

      // Jika check-in (ARRIVED), otomatis terbitkan tiket antrean poli hari ini
      if (checkInToQueue && nextStatus === 'ARRIVED') {
        const today = new Date().toISOString().slice(0, 10);
        const todayEncounters = await tx.encounter.findMany({
          where: { visitDate: today },
          select: { queueNumber: true },
        });
        const maxQueue = todayEncounters.reduce((max, e) => {
          const num = parseInt(e.queueNumber.replace(/[^0-9]/g, ''), 10);
          return !isNaN(num) && num > max ? num : max;
        }, 0);
        createdQueueNumber = `A-${String(maxQueue + 1).padStart(2, '0')}`;

        const encounter = await tx.encounter.create({
          data: {
            patientId: existing.patientId,
            doctorId: existing.doctorId,
            visitDate: today,
            queueNumber: createdQueueNumber,
            statusKunjungan: 'Menunggu',
            subjective: existing.chiefComplaint || 'Kunjungan sesuai jadwal janji temu.',
            objective: '',
            diagnosisIcd10: 'K02.1',
            suggestedTreatmentsJson: JSON.stringify(['TRT-001']),
            prescriptionNotes: '',
            registeredBy: `${user.name} (Check-in Booking)`,
          },
        });

        await tx.odontogramRecord.create({
          data: {
            encounterId: encounter.id,
            patientId: existing.patientId,
            dentitionType: existing.patient.age <= 12 ? 'mixed' : 'adult',
            teethJson: existing.patient.odontograms[0]?.teethJson || '{}',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: checkInToQueue ? 'APPOINTMENT_CHECKIN' : 'UPDATE_APPOINTMENT',
          entityType: 'Appointment',
          entityId: id,
          metadataJson: JSON.stringify({ status: nextStatus, createdQueueNumber }),
        },
      });

      return { appointment: updatedAppt, queueNumber: createdQueueNumber };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('PATCH /api/appointments/[id] error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui jadwal janji temu.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'DOKTER_LAIN', 'PENDAFTARAN']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    await prisma.appointment.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_APPOINTMENT',
        entityType: 'Appointment',
        entityId: id,
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/appointments/[id] error:', err);
    return NextResponse.json({ error: 'Gagal menghapus jadwal.' }, { status: 500 });
  }
}
