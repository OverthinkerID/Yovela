import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

export type NotificationCategory = 'JADWAL' | 'ANTREAN' | 'KASIR' | 'STOK' | 'SATUSEHAT';

export interface NotificationEntry {
  id: string;
  category: NotificationCategory;
  title: string;
  subtitle: string;
  href: string;
  type: 'info' | 'warning' | 'alert';
  timestamp: string;
  isRead: boolean;
}

async function getReadIds(userId: string): Promise<string[]> {
  const row = await prisma.clinicSetting.findUnique({
    where: { key: `notif_read_${userId}` },
  });
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN', 'KASIR']);
  if (errorResponse) return errorResponse;

  const [
    latestWaiting,
    waitingCount,
    latestPendingPay,
    pendingPaymentCount,
    latestBooked,
    bookedCount,
    latestChangedAppt,
    partialInvoice,
    partialInvoicesCount,
    inventoryItems,
    failedSatuSehat,
    readIds,
  ] = await Promise.all([
    prisma.encounter.findFirst({ where: { statusKunjungan: 'Menunggu' }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    prisma.encounter.count({ where: { statusKunjungan: 'Menunggu' } }),
    prisma.encounter.findFirst({ where: { statusKunjungan: 'Menunggu Pembayaran' }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
    prisma.encounter.count({ where: { statusKunjungan: 'Menunggu Pembayaran' } }),
    prisma.appointment.findFirst({ where: { status: 'BOOKED' }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    prisma.appointment.count({ where: { status: 'BOOKED' } }),
    prisma.appointment.findFirst({ where: { status: 'CANCELLED' }, orderBy: { updatedAt: 'desc' }, select: { id: true, updatedAt: true, scheduledDate: true, scheduledTime: true } }),
    prisma.invoice.findFirst({ where: { status: 'PARTIAL', remainingAmount: { gt: 0 } }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }).catch(() => null),
    prisma.invoice.count({ where: { status: 'PARTIAL', remainingAmount: { gt: 0 } } }),
    prisma.inventoryItem.findMany({ select: { id: true, stockQty: true, minStock: true, name: true, updatedAt: true } }),
    prisma.satuSehatSyncLog.findFirst({
      where: {
        OR: [
          { status: { contains: 'FAILED' } },
          { status: { contains: 'ERROR' } },
          { status: { contains: 'GAGAL' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, patientName: true, resourceType: true, createdAt: true },
    }),
    getReadIds(user.id),
  ]);

  const readSet = new Set(readIds);
  const rawItems: Omit<NotificationEntry, 'isRead'>[] = [];

  const lowStockItems = inventoryItems.filter((i) => i.stockQty <= i.minStock);
  if (lowStockItems.length > 0) {
    const sampleNames = lowStockItems.slice(0, 2).map((i) => i.name).join(', ');
    const latestLow = lowStockItems.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
    rawItems.push({
      id: `notif-low-stock-${lowStockItems.length}`,
      category: 'STOK',
      title: `${lowStockItems.length} Stok BHP Menipis / Kritis`,
      subtitle: `${sampleNames}${lowStockItems.length > 2 ? ', dll.' : ''} perlu segera di-restock`,
      href: '/stok',
      type: 'alert',
      timestamp: latestLow.updatedAt.toISOString(),
    });
  }

  if (failedSatuSehat) {
    rawItems.push({
      id: `notif-satusehat-${failedSatuSehat.id}`,
      category: 'SATUSEHAT',
      title: `Gagal Sinkronisasi SATUSEHAT (${failedSatuSehat.resourceType})`,
      subtitle: `Pasien ${failedSatuSehat.patientName} memerlukan pengiriman ulang payload FHIR`,
      href: '/satusehat',
      type: 'alert',
      timestamp: failedSatuSehat.createdAt.toISOString(),
    });
  }

  if (bookedCount > 0 && latestBooked) {
    rawItems.push({
      id: `notif-booking-${bookedCount}`,
      category: 'JADWAL',
      title: `${bookedCount} Booking Baru Menunggu Konfirmasi`,
      subtitle: 'Tinjau jadwal janji temu dari Landing Page atau Front Office',
      href: '/jadwal',
      type: 'info',
      timestamp: latestBooked.createdAt.toISOString(),
    });
  }

  if (latestChangedAppt) {
    rawItems.push({
      id: `notif-appt-cancel-${latestChangedAppt.id}`,
      category: 'JADWAL',
      title: 'Perubahan / Pembatalan Jadwal Terdeteksi',
      subtitle: `Slot ${latestChangedAppt.scheduledDate} pukul ${latestChangedAppt.scheduledTime} WIB berstatus dibatalkan`,
      href: '/jadwal',
      type: 'warning',
      timestamp: latestChangedAppt.updatedAt.toISOString(),
    });
  }

  if (waitingCount > 0 && latestWaiting) {
    rawItems.push({
      id: `notif-waiting-${waitingCount}`,
      category: 'ANTREAN',
      title: `${waitingCount} Pasien Menunggu di Ruang Tunggu`,
      subtitle: 'Siap dipanggil ke Ruang Tindakan 01',
      href: '/antrean',
      type: 'warning',
      timestamp: latestWaiting.createdAt.toISOString(),
    });
  }

  if (pendingPaymentCount > 0 && latestPendingPay) {
    rawItems.push({
      id: `notif-kasir-${pendingPaymentCount}`,
      category: 'KASIR',
      title: `${pendingPaymentCount} Tagihan Menunggu Pembayaran Kasir`,
      subtitle: 'Segera proses QRIS / EDC / Tunai di loket kasir',
      href: '/kasir',
      type: 'alert',
      timestamp: latestPendingPay.updatedAt.toISOString(),
    });
  }

  if (partialInvoicesCount > 0) {
    rawItems.push({
      id: `notif-cicilan-${partialInvoicesCount}`,
      category: 'KASIR',
      title: `${partialInvoicesCount} Invoice Cicilan Belum Lunas`,
      subtitle: 'Pantau sisa cicilan pasien di tab Riwayat Kasir',
      href: '/kasir',
      type: 'info',
      timestamp: (partialInvoice?.createdAt || new Date()).toISOString(),
    });
  }

  const notifications: NotificationEntry[] = rawItems
    .map((item) => ({
      ...item,
      isRead: readSet.has(item.id),
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({
    unreadCount,
    notifications,
  });
}

export async function PATCH(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN', 'KASIR']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const existing = await getReadIds(user.id);
    let nextReadIds = new Set(existing);

    if (body.action === 'mark_all_read' && Array.isArray(body.ids)) {
      body.ids.forEach((id: unknown) => nextReadIds.add(String(id)));
    } else if (body.action === 'mark_read' && body.id) {
      nextReadIds.add(String(body.id));
    }

    // Batasi maksimal 100 ID terbaru agar ringkas
    const trimmed = Array.from(nextReadIds).slice(-100);
    await prisma.clinicSetting.upsert({
      where: { key: `notif_read_${user.id}` },
      update: { value: JSON.stringify(trimmed) },
      create: { key: `notif_read_${user.id}`, value: JSON.stringify(trimmed) },
    });

    return NextResponse.json({ success: true, readCount: trimmed.length });
  } catch (err) {
    console.error('PATCH /api/notifications error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui status notifikasi.' }, { status: 500 });
  }
}
