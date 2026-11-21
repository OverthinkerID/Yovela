import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

export async function GET(request: Request) {
  const { errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month'); // YYYY-MM

  const all = await prisma.expense.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  const filtered = all.filter((item) => {
    if (month) return item.date.startsWith(month);
    if (year) return item.date.startsWith(year);
    return true;
  });

  const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({
    expenses: filtered,
    summary: { totalExpenses, count: filtered.length },
  });
}

export async function POST(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const date = String(body.date || new Date().toISOString().slice(0, 10)).trim();
    const category = String(body.category || 'Lainnya').trim();
    const description = String(body.description || '').trim();
    const amount = Math.round(Number(body.amount || 0));
    const periodType = String(body.periodType || 'BULANAN').toUpperCase();

    if (!description || amount <= 0) {
      return NextResponse.json(
        { error: 'Keterangan pengeluaran dan nominal (lebih dari Rp 0) wajib diisi.' },
        { status: 400 }
      );
    }

    const created = await prisma.expense.create({
      data: {
        date,
        category,
        description,
        amount,
        periodType: ['BULANAN', 'TAHUNAN', 'INSIDENTAL'].includes(periodType) ? periodType : 'BULANAN',
        createdBy: user.name,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_EXPENSE',
        entityType: 'Expense',
        entityId: created.id,
        metadataJson: JSON.stringify({ category, amount, date, periodType }),
      },
    });

    return NextResponse.json({ expense: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/expenses error:', err);
    return NextResponse.json({ error: 'Gagal mencatat pengeluaran klinik.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID pengeluaran wajib diisi.' }, { status: 400 });
    }

    await prisma.expense.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_EXPENSE',
        entityType: 'Expense',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/expenses error:', err);
    return NextResponse.json({ error: 'Gagal menghapus catatan pengeluaran.' }, { status: 500 });
  }
}
