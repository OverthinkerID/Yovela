'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppIcon } from '@/components/AppIcon';
import { KpiCard } from '@/components/ui/KpiCard';
import { KpiSkeletonGrid, CardListSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PatientRecord } from '../../../data/patientDatabase';
import { useAuth } from '../../../context/AuthContext';

interface AppointmentPreview {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  chiefComplaint: string;
  status: string;
  patient: { name: string; rmNumber: string };
}

interface TransactionPreview {
  id: string;
  date: string;
  paymentMethod: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

interface InventoryPreview {
  id: string;
  name: string;
  stockQty: number;
  minStock: number;
  unit: string;
}

export default function DashboardOverviewPage() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionPreview[]>([]);
  const [appointments, setAppointments] = useState<AppointmentPreview[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryPreview[]>([]);
  const [clockText, setClockText] = useState('');
  const [dateText, setDateText] = useState('');
  const [greeting, setGreeting] = useState('Selamat Datang');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 11) setGreeting('Selamat Pagi');
      else if (hour < 15) setGreeting('Selamat Siang');
      else if (hour < 18) setGreeting('Selamat Sore');
      else setGreeting('Selamat Malam');

      setClockText(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateText(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pRes, iRes, aRes, invRes] = await Promise.all([
        fetch('/api/patients', { cache: 'no-store' }).catch(() => null),
        fetch('/api/invoices', { cache: 'no-store' }).catch(() => null),
        fetch('/api/appointments', { cache: 'no-store' }).catch(() => null),
        fetch('/api/inventory', { cache: 'no-store' }).catch(() => null),
      ]);

      if (pRes?.ok) {
        const pData = await pRes.json();
        setPatients(pData.patients || []);
      }
      if (iRes?.ok) {
        const iData = await iRes.json();
        setTransactions(iData.transactions || []);
      }
      if (aRes?.ok) {
        const aData = await aRes.json();
        setAppointments(aData.appointments || []);
      }
      if (invRes?.ok) {
        const invData = await invRes.json();
        setInventoryItems(invData.items || []);
      }
    } catch (err) {
      console.error('Gagal memuat dasbor:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalPatientsToday = patients.length;
  const waitingCount = patients.filter((p) => p.statusKunjungan === 'Menunggu').length;
  const inProgressCount = patients.filter((p) => p.statusKunjungan === 'Sedang Diperiksa').length;
  const pendingPaymentCount = patients.filter((p) => p.statusKunjungan === 'Menunggu Pembayaran').length;
  const finishedCount = patients.filter((p) => p.statusKunjungan === 'Selesai').length;

  const totalKasMasuk = transactions.reduce((acc, curr) => acc + (curr.paidAmount ?? curr.amount ?? 0), 0);
  const totalPiutang = transactions.reduce((acc, curr) => acc + (curr.remainingAmount ?? 0), 0);
  const totalTagihan = totalKasMasuk + totalPiutang;
  const paidRatio = totalTagihan > 0 ? Math.round((totalKasMasuk / totalTagihan) * 100) : 100;

  const lowStockItems = useMemo(
    () => inventoryItems.filter((item) => item.stockQty <= item.minStock),
    [inventoryItems]
  );

  const visitBreakdown = useMemo(() => {
    const total = Math.max(1, totalPatientsToday);
    return [
      { label: 'Menunggu', count: waitingCount, pct: Math.round((waitingCount / total) * 100), color: 'bg-[#52796F]' },
      { label: 'Diperiksa', count: inProgressCount, pct: Math.round((inProgressCount / total) * 100), color: 'bg-[#E63946]' },
      { label: 'Kasir', count: pendingPaymentCount, pct: Math.round((pendingPaymentCount / total) * 100), color: 'bg-amber-500' },
      { label: 'Selesai', count: finishedCount, pct: Math.round((finishedCount / total) * 100), color: 'bg-[#1B4332]' },
    ];
  }, [totalPatientsToday, waitingCount, inProgressCount, pendingPaymentCount, finishedCount]);

  const paymentMethodSummary = useMemo(() => {
    const map = new Map<string, { method: string; total: number; count: number }>();
    transactions.forEach((tx) => {
      const key = tx.paymentMethod || 'Lainnya';
      const existing = map.get(key) || { method: key, total: 0, count: 0 };
      existing.total += tx.paidAmount ?? tx.amount ?? 0;
      existing.count += 1;
      map.set(key, existing);
    });
    const list = Array.from(map.values()).sort((a, b) => b.total - a.total);
    const maxTotal = Math.max(1, ...list.map((i) => i.total));
    return list.map((item) => ({
      ...item,
      pct: Math.round((item.total / maxTotal) * 100),
    }));
  }, [transactions]);

  const last7DaysRevenue = useMemo(() => {
    const days: { key: string; label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { weekday: 'short' });
      days.push({ key, label, total: 0 });
    }
    transactions.forEach((tx) => {
      const dayKey = (tx.date || '').slice(0, 10);
      const match = days.find((d) => d.key === dayKey);
      if (match) {
        match.total += tx.paidAmount ?? tx.amount ?? 0;
      }
    });
    const maxVal = Math.max(1, ...days.map((d) => d.total));
    return days.map((d) => ({
      ...d,
      heightPct: d.total > 0 ? Math.max(14, Math.round((d.total / maxVal) * 100)) : 6,
    }));
  }, [transactions]);

  const activeQueueList = useMemo(
    () =>
      patients
        .filter((p) => p.statusKunjungan === 'Sedang Diperiksa' || p.statusKunjungan === 'Menunggu')
        .slice(0, 5),
    [patients]
  );

  const upcomingBookings = useMemo(
    () => appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED').slice(0, 4),
    [appointments]
  );

  const activeStaffName = currentUser?.name || 'Staf / Dokter Klinik';
  const activeRoleLabel = currentUser?.roleLabel || currentUser?.role || 'Administrator';

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#1B4332] flex flex-col antialiased pb-12 w-full">
      <main className="max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-5 sm:space-y-6">
        {/* BANNER SELAMAT DATANG RESPONSIF */}
        <div className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#0E261C] animate-gradient-flow text-[#FAF7F0] rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 shadow-xl shadow-[#1B4332]/20 relative overflow-hidden border border-[#2D6A4F]">
          <div className="absolute -right-14 -top-14 w-72 h-72 rounded-full bg-[#40916C]/30 blur-3xl pointer-events-none animate-float-slow" />
          <div
            className="absolute right-24 -bottom-20 w-60 h-60 rounded-full bg-[#E63946]/25 blur-3xl pointer-events-none animate-float-slow"
            style={{ animationDelay: '1.8s' }}
          />
          <div
            className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none animate-float-slow"
            style={{ animationDelay: '0.9s' }}
          >
            <AppIcon name="tooth" className="w-48 h-48 text-[#FAF7F0]" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F0]/10 border border-[#FAF7F0]/20 text-[#FAF7F0] text-[10px] sm:text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse" />
                  <span>Klinik Aktif • SIM-RME Live</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E261C]/80 border border-[#2D6A4F] text-[#95D5B2] text-[10px] sm:text-[11px] font-mono font-bold">
                  <AppIcon name="user-clock" className="w-3 h-3" />
                  <span>{clockText || '00:00:00'} WIB</span>
                </span>
              </div>

              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-[#B7D3C4]">{dateText}</p>
                <h1 className="text-xl sm:text-3xl font-black tracking-tight text-[#FAF7F0] mt-0.5 leading-snug">
                  {greeting}, {activeStaffName}
                </h1>
              </div>

              <p className="text-[11px] sm:text-xs text-[#D8E8DF] max-w-2xl leading-relaxed">
                Anda masuk sebagai{' '}
                <strong className="text-[#FAF7F0] underline decoration-[#E63946]">{activeRoleLabel}</strong>. Saat ini ada{' '}
                <strong className="text-[#FAF7F0]">{waitingCount + inProgressCount} pasien di antrean poli</strong> dan{' '}
                <strong className="text-[#FAF7F0]">{pendingPaymentCount} tagihan menunggu kasir</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <Link
                href="/jadwal"
                className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 border border-[#FAF7F0]/20 text-[#FAF7F0] font-bold text-xs transition inline-flex items-center justify-center gap-2"
              >
                <AppIcon name="calendar-check" className="w-4 h-4 text-[#95D5B2]" />
                <span>Jadwal Booking</span>
              </Link>
              <Link
                href="/poli"
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold text-xs shadow-lg shadow-[#E63946]/30 transition inline-flex items-center justify-center gap-2"
              >
                <AppIcon name="tooth" className="w-4 h-4" />
                <span>Buka Ruang Poli</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KARTU KPI UTAMA (2 KOLOM DI MOBILE, 4 KOLOM DI DESKTOP) */}
        {isLoading ? (
          <KpiSkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard
              label="Pasien Terdaftar"
              value={totalPatientsToday}
              subtitle="Rekam medis aktif"
              icon="users"
              tone="forest"
            />
            <KpiCard
              label="Antrean Poli"
              value={waitingCount + inProgressCount}
              subtitle={`${waitingCount} tunggu • ${inProgressCount} poli`}
              icon="clock-rotate-left"
              tone="tomato"
            />
            <KpiCard
              label="Pending Kasir"
              value={pendingPaymentCount}
              subtitle="Siap QRIS / EDC / Tunai"
              icon="cash-register"
              tone="emerald"
            />
            <KpiCard
              label="Kas Masuk Aktual"
              value={`Rp ${totalKasMasuk.toLocaleString('id-ID')}`}
              subtitle={
                totalPiutang > 0
                  ? `${transactions.length} trx • Piutang Rp ${totalPiutang.toLocaleString('id-ID')}`
                  : `${transactions.length} transaksi lunas`
              }
              icon="wallet"
              tone="forest"
              progressPercent={paidRatio}
            />
          </div>
        )}

        {/* ANALITIK OPERASIONAL & KEUANGAN AKTUAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Distribusi Kunjungan & Alert Stok BHP */}
          <div className="lg:col-span-5 yovela-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E1D3] pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#1B4332]">Distribusi Status Pasien</h2>
                <p className="text-[11px] text-[#52796F]">Sebaran kunjungan aktif di database klinik</p>
              </div>
              <StatusBadge label={`${totalPatientsToday} Total`} tone="forest" />
            </div>

            <div className="space-y-3">
              {visitBreakdown.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1B4332]">{item.label}</span>
                    <span className="font-mono text-[11px] text-[#52796F]">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E8E1D3] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E8E1D3]">
              {lowStockItems.length > 0 ? (
                <Link
                  href="/stok"
                  className="p-3 rounded-2xl bg-[#E63946]/10 border border-[#E63946]/30 flex items-center justify-between gap-3 hover:bg-[#E63946]/15 transition"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#E63946]">
                      {lowStockItems.length} Stok BHP Menipis
                    </p>
                    <p className="text-[10px] text-[#52796F] truncate">
                      {lowStockItems
                        .slice(0, 2)
                        .map((i) => `${i.name} (${i.stockQty} ${i.unit})`)
                        .join(', ')}
                    </p>
                  </div>
                  <AppIcon name="arrow-right" className="w-3.5 h-3.5 text-[#E63946] shrink-0" />
                </Link>
              ) : (
                <div className="p-3 rounded-2xl bg-[#F5F1E8] border border-[#E8E1D3] flex items-center justify-between text-xs">
                  <span className="font-bold text-[#2D6A4F]">Stok Bahan Medis (BHP) Terkendali</span>
                  <StatusBadge label="Aman" tone="emerald" dot />
                </div>
              )}
            </div>
          </div>

          {/* Tren Pendapatan 7 Hari & Metode Pembayaran */}
          <div className="lg:col-span-7 yovela-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E1D3] pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#1B4332]">Pendapatan 7 Hari &amp; Metode Bayar</h2>
                <p className="text-[11px] text-[#52796F]">Kalkulasi langsung dari transaksi kasir</p>
              </div>
              <Link href="/laporan" className="text-xs font-bold text-[#E63946] hover:underline">
                Laporan Lengkap
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
              {/* Bar Chart 7 Hari */}
              <div className="p-4 rounded-2xl bg-[#F5F1E8] border border-[#E8E1D3] space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] block">
                  Pemasukan 7 Hari Terakhir
                </span>
                <div className="h-28 flex items-end justify-between gap-2 pt-2">
                  {last7DaysRevenue.map((d) => (
                    <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div
                        title={`${d.key}: Rp ${d.total.toLocaleString('id-ID')}`}
                        className={`w-full max-w-[26px] rounded-t-lg transition-all duration-500 ${
                          d.total > 0 ? 'bg-[#1B4332]' : 'bg-[#DED6C5]'
                        }`}
                        style={{ height: `${d.heightPct}%` }}
                      />
                      <span className="text-[10px] font-mono font-bold text-[#52796F]">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Komposisi Metode Bayar */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] block">
                  Metode Pembayaran Aktual
                </span>
                {paymentMethodSummary.length === 0 ? (
                  <p className="text-xs text-[#52796F] py-4">Belum ada transaksi kasir tercatat.</p>
                ) : (
                  paymentMethodSummary.slice(0, 4).map((pm) => (
                    <div key={pm.method} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1B4332]">
                          {pm.method} <span className="text-[10px] font-normal text-[#52796F]">({pm.count}x)</span>
                        </span>
                        <span className="font-mono font-bold text-[#1B4332]">
                          Rp {pm.total.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E8E1D3] overflow-hidden">
                        <div className="h-full bg-[#2D6A4F] rounded-full" style={{ width: `${pm.pct}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LIVE FEED ANTREAN & JADWAL BOOKING */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Antrean Live */}
          <div className="lg:col-span-7 yovela-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E1D3] pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#1B4332]">Antrean Poli Hari Ini (Live)</h2>
                <p className="text-[11px] text-[#52796F]">Pasien yang sedang menunggu atau diperiksa di dental chair</p>
              </div>
              <Link href="/antrean" className="text-xs font-bold text-[#E63946] hover:underline">
                Kelola Antrean
              </Link>
            </div>

            {isLoading ? (
              <CardListSkeleton rows={3} />
            ) : activeQueueList.length === 0 ? (
              <EmptyState
                icon="clock-rotate-left"
                title="Belum Ada Antrean Aktif"
                description="Pasien yang didaftarkan hari ini akan langsung muncul pada daftar antrean poli."
              />
            ) : (
              <div className="space-y-2.5">
                {activeQueueList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-[#F5F1E8] border border-[#E8E1D3] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1B4332] text-[#FAF7F0] font-mono font-black flex items-center justify-center shrink-0">
                        {p.queueNumber}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#1B4332] truncate">{p.name}</p>
                        <p className="text-[10px] font-mono text-[#52796F] truncate">
                          {p.rmNumber} • {p.age} th
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      label={p.statusKunjungan}
                      tone={p.statusKunjungan === 'Sedang Diperiksa' ? 'tomato' : 'neutral'}
                      dot={p.statusKunjungan === 'Sedang Diperiksa'}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Jadwal Booking Mendatang */}
          <div className="lg:col-span-5 yovela-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E1D3] pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#1B4332]">Booking Janji Temu</h2>
                <p className="text-[11px] text-[#52796F]">Sinkron otomatis dari Landing Page &amp; Front Office</p>
              </div>
              <Link href="/jadwal" className="text-xs font-bold text-[#E63946] hover:underline">
                Semua Jadwal
              </Link>
            </div>

            {isLoading ? (
              <CardListSkeleton rows={3} />
            ) : upcomingBookings.length === 0 ? (
              <EmptyState
                icon="calendar-check"
                title="Belum Ada Booking Mendatang"
                description="Buat jadwal janji temu baru atau tunggu reservasi pasien dari Landing Page."
                actionLabel="Buat Jadwal Baru"
                actionHref="/jadwal"
              />
            ) : (
              <div className="space-y-2.5">
                {upcomingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-[#F5F1E8] border border-[#E8E1D3] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#1B4332] truncate">{b.patient.name}</p>
                        <StatusBadge
                          label={b.status}
                          tone={b.status === 'CONFIRMED' ? 'emerald' : 'amber'}
                        />
                      </div>
                      <p className="text-[10px] text-[#52796F] truncate">{b.chiefComplaint}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-mono font-bold text-[#E63946]">{b.scheduledTime}</span>
                      <span className="block font-mono text-[10px] text-[#52796F]">{b.scheduledDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PUSAT PINTASAN MODUL (2 KOLOM MOBILE, 4 KOLOM DESKTOP) */}
        <div className="yovela-card p-5 sm:p-6 space-y-4">
          <div className="border-b border-[#E8E1D3] pb-3">
            <h2 className="text-sm font-extrabold text-[#1B4332]">Pintasan Modul Operasional</h2>
            <p className="text-[11px] text-[#52796F]">Akses cepat seluruh fitur Yovela Dental Clinic</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: '/jadwal', icon: 'calendar-check', title: 'Jadwal Janji Temu', desc: 'Booking & WA reminder' },
              { href: '/pasien', icon: 'user-plus', title: 'Pendaftaran Pasien', desc: 'Pasien baru & kontrol' },
              { href: '/poli', icon: 'tooth', title: 'Pemeriksaan Poli', desc: 'Odontogram FDI & Consent' },
              { href: '/kasir', icon: 'receipt', title: 'Kasir & QRIS/EDC', desc: 'Diskon, DP & cicilan' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#F5F1E8] border border-[#E8E1D3] hover:border-[#1B4332] transition flex flex-col sm:flex-row items-start sm:items-center gap-3 group"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#1B4332] group-hover:bg-[#E63946] text-[#FAF7F0] flex items-center justify-center transition shrink-0">
                  <AppIcon name={item.icon} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-extrabold text-[#1B4332] leading-snug">{item.title}</h3>
                  <p className="text-[10px] text-[#52796F] leading-snug mt-0.5">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
