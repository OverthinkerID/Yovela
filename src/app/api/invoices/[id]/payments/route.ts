import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'KASIR']);
  if (errorResponse) return errorResponse;

  try {
    const { id: invoiceId } = await context.params;
    const body = await request.json();
    const paymentMethod = String(body.paymentMethod || 'QRIS');
    const amount = Math.round(Number(body.amount || 0));
    const note = body.note ? String(body.note).trim() : null;

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Nominal pembayaran cicilan harus lebih besar dari Rp 0.' },
        { status: 400 }
      );
    }

    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        patient: { select: { name: true, rmNumber: true } },
        items: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan.' }, { status: 404 });
    }

    if (existing.status === 'PAID' || existing.remainingAmount <= 0) {
      return NextResponse.json({ error: 'Tagihan ini sudah lunas.' }, { status: 400 });
    }

    const appliedAmount = Math.min(amount, existing.remainingAmount);
    const cashGiven =
      paymentMethod === 'Tunai' ? Number(body.cashGiven || amount) : appliedAmount;

    if (paymentMethod === 'Tunai' && cashGiven < appliedAmount) {
      return NextResponse.json(
        { error: 'Nominal uang tunai kurang dari jumlah cicilan.' },
        { status: 400 }
      );
    }

    const change = paymentMethod === 'Tunai' ? Math.max(0, cashGiven - appliedAmount) : 0;
    const nextPaidAmount = existing.paidAmount + appliedAmount;
    const nextRemaining = Math.max(0, existing.amount - nextPaidAmount);
    const nextStatus = nextRemaining === 0 ? 'PAID' : 'PARTIAL';
    const cashierName = `${user.name} (${user.roleLabel || user.role})`;
    const installmentIndex = existing.payments.length + 1;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoicePayment.create({
        data: {
          invoiceId,
          amount: appliedAmount,
          paymentMethod,
          cashGiven,
          change,
          note: note || (nextRemaining === 0 ? `Pelunasan (Cicilan ke-${installmentIndex})` : `Cicilan ke-${installmentIndex}`),
          cashierId: user.id,
          cashierName,
        },
      });

      const inv = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: nextPaidAmount,
          remainingAmount: nextRemaining,
          status: nextStatus,
          paymentMethod,
          cashGiven,
          change,
        },
        include: {
          patient: { select: { name: true, rmNumber: true } },
          items: true,
          payments: { orderBy: { paidAt: 'asc' } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'ADD_INVOICE_PAYMENT',
          entityType: 'Invoice',
          entityId: invoiceId,
          metadataJson: JSON.stringify({ appliedAmount, nextRemaining, nextStatus, paymentMethod }),
        },
      });

      return inv;
    });

    return NextResponse.json({
      invoice: {
        id: updated.id,
        invoiceNo: updated.invoiceNo,
        status: updated.status,
        paidAmount: updated.paidAmount,
        remainingAmount: updated.remainingAmount,
        payments: updated.payments,
      },
    });
  } catch (err) {
    console.error('POST /api/invoices/[id]/payments error:', err);
    return NextResponse.json({ error: 'Gagal mencatat pembayaran cicilan.' }, { status: 500 });
  }
}
