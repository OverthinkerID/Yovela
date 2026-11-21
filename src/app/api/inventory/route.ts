import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

const DEFAULT_BHP_ITEMS = [
  { code: 'BHP-001', name: 'Sarung Tangan Nitril (Size S/M)', category: 'APD', unit: 'Box', stockQty: 12, minStock: 5, unitPrice: 65000 },
  { code: 'BHP-002', name: 'Masker Medis 3-Ply Earloop', category: 'APD', unit: 'Box', stockQty: 10, minStock: 4, unitPrice: 35000 },
  { code: 'BHP-003', name: 'Komposit Nano-Hybrid Shade A2', category: 'Bahan Tambal', unit: 'Syringe', stockQty: 4, minStock: 5, unitPrice: 285000 },
  { code: 'BHP-004', name: 'Anestesi Lokal Scandonest / Pehacain', category: 'Anestesi', unit: 'Box', stockQty: 3, minStock: 4, unitPrice: 240000 },
  { code: 'BHP-005', name: 'Jarum Carpule Dental 30G Short', category: 'Anestesi', unit: 'Box', stockQty: 8, minStock: 3, unitPrice: 125000 },
  { code: 'BHP-006', name: 'Sterilization Pouch Autoclave 90x260mm', category: 'Sterilisasi', unit: 'Pack', stockQty: 6, minStock: 4, unitPrice: 145000 },
];

async function ensureSeedInventory() {
  const count = await prisma.inventoryItem.count();
  if (count === 0) {
    await prisma.inventoryItem.createMany({ data: DEFAULT_BHP_ITEMS });
  }
}

export async function GET() {
  const { errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN', 'KASIR']);
  if (errorResponse) return errorResponse;

  await ensureSeedInventory();

  const items = await prisma.inventoryItem.findMany({
    orderBy: [{ code: 'asc' }],
    include: {
      movements: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  const lowStockItems = items.filter((i) => i.stockQty <= i.minStock);
  const totalAssetValue = items.reduce((sum, i) => sum + i.stockQty * i.unitPrice, 0);

  return NextResponse.json({
    items,
    summary: {
      totalItems: items.length,
      lowStockCount: lowStockItems.length,
      totalAssetValue,
    },
  });
}

export async function POST(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const category = String(body.category || 'APD').trim();
    const unit = String(body.unit || 'Box').trim();
    const stockQty = Math.max(0, Math.round(Number(body.stockQty || 0)));
    const minStock = Math.max(1, Math.round(Number(body.minStock || 5)));
    const unitPrice = Math.max(0, Math.round(Number(body.unitPrice || 0)));

    if (!name) {
      return NextResponse.json({ error: 'Nama bahan habis pakai (BHP) wajib diisi.' }, { status: 400 });
    }

    const totalCount = await prisma.inventoryItem.count();
    const code = String(body.code || `BHP-${String(totalCount + 1).padStart(3, '0')}`).toUpperCase();

    const created = await prisma.inventoryItem.create({
      data: {
        code,
        name,
        category,
        unit,
        stockQty,
        minStock,
        unitPrice,
        lastRestockAt: stockQty > 0 ? new Date() : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_INVENTORY_ITEM',
        entityType: 'InventoryItem',
        entityId: created.id,
        metadataJson: JSON.stringify({ code, name, stockQty }),
      },
    });

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/inventory error:', err);
    return NextResponse.json({ error: 'Gagal menambahkan item stok BHP.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const itemId = String(body.itemId || '').trim();
    const type = body.type === 'OUT' ? 'OUT' : 'IN';
    const qty = Math.max(1, Math.round(Number(body.qty || 0)));
    const notes = String(body.notes || '').trim();
    const recordAsExpense = Boolean(body.recordAsExpense) && type === 'IN' && user.role === 'DOKTER';

    if (!itemId || qty <= 0) {
      return NextResponse.json({ error: 'Item dan jumlah perubahan stok wajib valid.' }, { status: 400 });
    }

    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: 'Item BHP tidak ditemukan.' }, { status: 404 });
    }

    const unitCost = body.unitCost !== undefined ? Math.max(0, Math.round(Number(body.unitCost))) : item.unitPrice;
    const totalCost = unitCost * qty;
    const nextQty = type === 'IN' ? item.stockQty + qty : Math.max(0, item.stockQty - qty);

    let createdExpenseId: string | null = null;
    if (recordAsExpense && totalCost > 0) {
      const expense = await prisma.expense.create({
        data: {
          date: new Date().toISOString().slice(0, 10),
          category: 'Pembelian Bahan & BHP',
          description: `Restock ${item.name} (${qty} ${item.unit})${notes ? ` — ${notes}` : ''}`,
          amount: totalCost,
          periodType: 'BULANAN',
          createdBy: user.name,
        },
      });
      createdExpenseId = expense.id;
    }

    const [updatedItem] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          stockQty: nextQty,
          unitPrice: type === 'IN' && unitCost > 0 ? unitCost : item.unitPrice,
          lastRestockAt: type === 'IN' ? new Date() : item.lastRestockAt,
        },
      }),
      prisma.inventoryMovement.create({
        data: {
          itemId,
          type,
          qty,
          unitCost,
          totalCost,
          notes: notes || (type === 'IN' ? 'Restock bahan klinik' : 'Pemakaian harian poli'),
          expenseId: createdExpenseId,
          createdBy: user.name,
        },
      }),
    ]);

    return NextResponse.json({
      item: updatedItem,
      expenseRecorded: Boolean(createdExpenseId),
    });
  } catch (err) {
    console.error('PATCH /api/inventory error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui stok BHP.' }, { status: 500 });
  }
}
