import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const testimonials = await prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  const avgRating =
    testimonials.length > 0
      ? Number(
          (
            testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
          ).toFixed(1)
        )
      : 5.0;

  return NextResponse.json({
    testimonials,
    stats: {
      total: testimonials.length,
      averageRating: avgRating,
      googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Yovela+Dental+Clinic+Semarang',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const patientName = String(body.patientName || '').trim();
    const serviceName = String(body.serviceName || 'Pemeriksaan Gigi').trim();
    const comment = String(body.comment || '').trim();
    const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 5)));
    const source = body.source === 'GOOGLE_REVIEW' ? 'GOOGLE_REVIEW' : 'CLINIC_APP';

    if (!patientName || comment.length < 10) {
      return NextResponse.json(
        { error: 'Nama pasien dan ulasan (minimal 10 karakter) wajib diisi.' },
        { status: 400 }
      );
    }

    const created = await prisma.testimonial.create({
      data: {
        patientName,
        serviceName,
        rating,
        comment,
        source,
        isPublished: true,
      },
    });

    return NextResponse.json({ testimonial: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/public/testimonials error:', err);
    return NextResponse.json({ error: 'Gagal menyimpan testimoni.' }, { status: 500 });
  }
}
