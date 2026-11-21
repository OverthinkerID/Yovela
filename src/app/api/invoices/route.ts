import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

function formatInvoice(inv: any) {
  const dt = new Date(inv.paidAt);
  const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
    dt.getDate()
  ).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(
    dt.getMinutes()
  ).padStart(2, '0')}`;

  return {
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    encounterId: inv.encounterId,
    date: dateStr,
    patientName: inv.patient.name,
    rmNumber: inv.patient.rmNumber,
    doctorName: inv.doctorName,
    cashierName: inv.cashierName,
    treatments: inv.items.map((item: any) => item.treatmentName),
    items: inv.items,
    paymentMethod: inv.paymentMethod,
    subtotal: inv.subtotal || inv.amount,
    discountAmount: inv.discountAmount || 0,
    discountNote: inv.discountNote || '',
    amount: inv.amount,
    paidAmount: inv.paidAmount || inv.amount,
    remainingAmount: inv.remainingAmount || 0,
    cashGiven: inv.cashGiven ?? inv.paidAmount ?? inv.amount,
    change: inv.change || 0,
    status: inv.status,
    payments: (inv.payments || []).map((p: any) => ({
      id: p.id,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      cashGiven: p.cashGiven,
      change: p.change,
      note: p.note,
      cashierName: p.cashierName,
      paidAt: p.paidAt,
    })),
  };
}

export async function GET() {
  const { errorResponse } = await requireAuth(['DOKTER', 'KASIR', 'PENDAFTARAN']);
  if (errorResponse) return errorResponse;

  const invoices = await prisma.invoice.findMany({
    include: {
      patient: { select: { name: true, rmNumber: true } },
      items: true,
      payments: { orderBy: { paidAt: 'asc' } },
    },
    orderBy: { paidAt: 'desc' },
  });

  return NextResponse.json({ transactions: invoices.map(formatInvoice) });
}

export async function POST(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'KASIR']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const encounterId = String(body.encounterId || '').trim();
    const paymentMethod = String(body.paymentMethod || 'QRIS');
    const cashGivenRaw = body.cashGiven;
    const rawDiscount = Math.max(0, Math.round(Number(body.discountAmount || 0)));
    const discountNote = body.discountNote ? String(body.discountNote).trim() : null;
    const isInstallment = Boolean(body.isInstallment);

    if (!encounterId) {
      return NextResponse.json({ error: 'encounterId wajib diisi.' }, { status: 400 });
    }

    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: {
        patient: true,
        doctor: true,
        invoice: true,
      },
    });

    if (!encounter) {
      return NextResponse.json({ error: 'Kunjungan tidak ditemukan.' }, { status: 404 });
    }

    if (encounter.invoice) {
      return NextResponse.json(
        { error: `Kunjungan ini sudah memiliki tagihan (${encounter.invoice.invoiceNo}).` },
        { status: 409 }
      );
    }

    let treatmentIds: string[] = ['TRT-001'];
    try {
      const parsed = JSON.parse(encounter.suggestedTreatmentsJson);
      if (Array.isArray(parsed) && parsed.length > 0) treatmentIds = parsed;
    } catch {}

    let treatments = await prisma.treatment.findMany({
      where: { id: { in: treatmentIds } },
    });

    if (treatments.length === 0) {
      const fallback = await prisma.treatment.findUnique({ where: { id: 'TRT-001' } });
      if (fallback) treatments = [fallback];
    }

    const subtotal = treatments.reduce((sum, t) => sum + t.price, 0);
    const discountAmount = Math.min(rawDiscount, subtotal);
    const totalAmount = Math.max(0, subtotal - discountAmount);

    const paidNow = isInstallment
      ? Math.min(totalAmount, Math.max(0, Math.round(Number(body.paidNow || 0))))
      : totalAmount;

    if (isInstallment && paidNow <= 0) {
      return NextResponse.json(
        { error: 'Nominal DP / cicilan pertama harus lebih besar dari Rp 0.' },
        { status: 400 }
      );
    }

    const cashGiven =
      paymentMethod === 'Tunai' ? Number(cashGivenRaw || 0) : paidNow;

    if (paymentMethod === 'Tunai' && cashGiven < paidNow) {
      return NextResponse.json(
        { error: 'Nominal uang tunai kurang dari jumlah yang dibayar sekarang.' },
        { status: 400 }
      );
    }

    const change = paymentMethod === 'Tunai' ? Math.max(0, cashGiven - paidNow) : 0;
    const remainingAmount = Math.max(0, totalAmount - paidNow);
    const invoiceStatus = remainingAmount > 0 ? 'PARTIAL' : 'PAID';

    const now = new Date();
    const invoiceNo = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${encounter.queueNumber}-${String(now.getTime()).slice(-3)}`;

    const doctorName = encounter.doctor?.name || 'drg. Yuli Kartilla Panjaitan';
    const cashierName = `${user.name} (${user.roleLabel || user.role})`;

    const createdInvoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNo,
          encounterId: encounter.id,
          patientId: encounter.patientId,
          doctorName,
          cashierId: user.id,
          cashierName,
          paymentMethod,
          subtotal,
          discountAmount,
          discountNote,
          amount: totalAmount,
          paidAmount: paidNow,
          remainingAmount,
          cashGiven,
          change,
          status: invoiceStatus,
          items: {
            create: treatments.map((t) => ({
              treatmentId: t.id,
              treatmentName: t.name,
              icd9cm: t.icd9cm,
              unitPrice: t.price,
              qty: 1,
              lineTotal: t.price,
            })),
          },
          payments: {
            create: {
              amount: paidNow,
              paymentMethod,
              cashGiven,
              change,
              note: isInstallment ? 'Pembayaran DP / Cicilan ke-1' : 'Pembayaran Lunas',
              cashierId: user.id,
              cashierName,
            },
          },
        },
        include: {
          patient: { select: { name: true, rmNumber: true } },
          items: true,
          payments: { orderBy: { paidAt: 'asc' } },
        },
      });

      await tx.encounter.update({
        where: { id: encounter.id },
        data: { statusKunjungan: 'Selesai' },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: isInstallment ? 'CREATE_INVOICE_INSTALLMENT' : 'CREATE_INVOICE',
          entityType: 'Invoice',
          entityId: inv.id,
          metadataJson: JSON.stringify({
            invoiceNo,
            subtotal,
            discountAmount,
            totalAmount,
            paidNow,
            remainingAmount,
            paymentMethod,
          }),
        },
      });

      return inv;
    });

    return NextResponse.json(
      { transaction: formatInvoice(createdInvoice) },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/invoices error:', err);
    return NextResponse.json({ error: 'Gagal memproses pembayaran kasir.' }, { status: 500 });
  }
}
