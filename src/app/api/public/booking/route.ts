import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sendBookingWhatsAppNotification } from '../../../../lib/whatsapp';

async function generateNextRmNumber(): Promise<string> {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const scheduledDate = String(body.scheduledDate || '').trim();
    const scheduledTime = String(body.scheduledTime || '').trim();
    const serviceName = String(body.serviceName || 'Konsultasi & Pemeriksaan Gigi').trim();
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!name || !phone || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Nama lengkap, nomor WhatsApp, tanggal, dan jam kunjungan wajib diisi.' },
        { status: 400 }
      );
    }

    const doctor = await prisma.user.findFirst({
      where: { role: 'DOKTER', isActive: true },
      select: { id: true, name: true },
    });

    if (doctor) {
      const conflict = await prisma.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          scheduledDate,
          scheduledTime,
          status: { in: ['BOOKED', 'CONFIRMED', 'ARRIVED'] },
        },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `Maaf, slot ${scheduledDate} pukul ${scheduledTime} WIB sudah terisi. Silakan pilih jam lain.` },
          { status: 409 }
        );
      }
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    let patient = await prisma.patient.findFirst({
      where: { phone: cleanPhone },
    });

    if (!patient) {
      const rmNumber = await generateNextRmNumber();
      patient = await prisma.patient.create({
        data: {
          rmNumber,
          name,
          age: Number(body.age) || 28,
          gender: body.gender === 'Laki-laki' ? 'Laki-laki' : 'Perempuan',
          phone: cleanPhone,
          address: String(body.address || '').trim(),
          allergies: 'Tidak Ada',
          registeredBy: 'Booking Online Landing Page',
        },
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor?.id ?? null,
        scheduledDate,
        scheduledTime,
        durationMin: 30,
        chiefComplaint: serviceName,
        notes: notes ? `[Booking Web] ${notes}` : '[Booking Web Landing Page]',
        status: 'BOOKED',
      },
    });

    const doctorName = doctor?.name || 'drg. Yuli Kartilla Panjaitan';
    let whatsappStatus: string = 'DISABLED';
    try {
      const waRes = await sendBookingWhatsAppNotification({
        patientName: patient.name,
        patientPhone: patient.phone,
        rmNumber: patient.rmNumber,
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime,
        serviceName,
        doctorName,
      });
      whatsappStatus = waRes.status;
    } catch (waErr) {
      console.warn('WhatsApp webhook skipped:', waErr);
    }

    return NextResponse.json(
      {
        booking: {
          id: appointment.id,
          patientName: patient.name,
          rmNumber: patient.rmNumber,
          scheduledDate: appointment.scheduledDate,
          scheduledTime: appointment.scheduledTime,
          doctorName,
          serviceName,
          whatsappStatus,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/public/booking error:', err);
    return NextResponse.json({ error: 'Gagal memproses booking online.' }, { status: 500 });
  }
}
