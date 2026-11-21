import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

export async function GET() {
  const { errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN', 'KASIR']);
  if (errorResponse) return errorResponse;

  const [waitingCount, pendingPaymentCount, bookedCount, partialInvoices, inventoryItems] = await Promise.all([
    prisma.encounter.count({ where: { statusKunjungan: 'Menunggu' } }),
    prisma.encounter.count({ where: { statusKunjungan: 'Menunggu Pembayaran' } }),
    prisma.appointment.count({ where: { status: 'BOOKED' } }),
    prisma.invoice.count({ where: { status: 'PARTIAL', remainingAmount: { gt: 0 } } }),
    prisma.inventoryItem.findMany({ select: { stockQty: true, minStock: true, name: true } }),
  ]);

  const lowStockItems = inventoryItems.filter((i) => i.stockQty <= i.minStock);

  const items: { id: string; title: string; subtitle: string; href: string; type: 'info' | 'warning' | 'alert' }[] = [];

  if (lowStockItems.length > 0) {
    const sampleNames = lowStockItems
      .slice(0, 2)
      .map((i) => i.name)
      .join(', ');
    items.push({
      id: 'notif-low-stock',
      title: `${lowStockItems.length} Stok BHP Menipis / Kritis`,
      subtitle: `${sampleNames}${lowStockItems.length > 2 ? ', dll.' : ''} perlu segera di-restock`,
      href: '/stok',
      type: 'alert',
    });
  }
  if (bookedCount > 0) {
    items.push({
      id: 'notif-booking',
      title: `${bookedCount} Booking Baru Menunggu Konfirmasi`,
      subtitle: 'Tinjau jadwal janji temu dari Landing Page atau Front Office',
      href: '/jadwal',
      type: 'info',
    });
  }
  if (waitingCount > 0) {
    items.push({
      id: 'notif-waiting',
      title: `${waitingCount} Pasien Menunggu di Ruang Tunggu`,
      subtitle: 'Siap dipanggil ke Ruang Tindakan 01',
      href: '/antrean',
      type: 'warning',
    });
  }
  if (pendingPaymentCount > 0) {
    items.push({
      id: 'notif-kasir',
      title: `${pendingPaymentCount} Tagihan Menunggu Pembayaran Kasir`,
      subtitle: 'Segera proses QRIS / EDC / Tunai di loket kasir',
      href: '/kasir',
      type: 'alert',
    });
  }
  if (partialInvoices > 0) {
    items.push({
      id: 'notif-cicilan',
      title: `${partialInvoices} Invoice Cicilan Belum Lunas`,
      subtitle: 'Pantau sisa cicilan pasien di tab Riwayat Kasir',
      href: '/kasir',
      type: 'info',
    });
  }

  return NextResponse.json({
    unreadCount: items.length,
    notifications: items,
  });
}
