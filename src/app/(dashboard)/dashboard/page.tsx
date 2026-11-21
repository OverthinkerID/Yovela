'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppIcon } from '@/components/AppIcon';
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

export default function DashboardOverviewPage() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<AppointmentPreview[]>([]);
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

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [pRes, iRes, aRes] = await Promise.all([
          fetch('/api/patients', { cache: 'no-store' }),
          fetch('/api/invoices', { cache: 'no-store' }),
          fetch('/api/appointments', { cache: 'no-store' }),
        ]);
        if (pRes.ok) {
          const pData = await pRes.json();
          setPatients(pData.patients || []);
        }
        if (iRes.ok) {
          const iData = await iRes.json();
          setTransactions(iData.transactions || []);
        }
        if (aRes.ok) {
          const aData = await aRes.json();
          setAppointments(aData.appointments || []);
        }
      } catch (err) {
        console.error('Gagal memuat dasbor:', err);
      }
    };
    loadDashboard();
  }, []);

  const totalPatientsToday = patients.length;
  const waitingCount = patients.filter((p) => p.statusKunjungan === 'Menunggu').length;
  const inProgressCount = patients.filter((p) => p.statusKunjungan === 'Sedang Diperiksa').length;
  const pendingPaymentCount = patients.filter((p) => p.statusKunjungan === 'Menunggu Pembayaran').length;

  const totalKasMasuk = transactions.reduce((acc, curr) => acc + (curr.paidAmount ?? curr.amount ?? 0), 0);
  const totalPiutang = transactions.reduce((acc, curr) => acc + (curr.remainingAmount ?? 0), 0);
  const totalTagihan = totalKasMasuk + totalPiutang;
  const paidRatio = totalTagihan > 0 ? Math.round((totalKasMasuk / totalTagihan) * 100) : 100;

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
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* BANNER SELAMAT DATANG YANG HIDUP & BERANIMASI (Forest Green + Oat Milk + Red Tomato) */}
        <div className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#0E261C] animate-gradient-flow text-[#FAF7F0] rounded-[32px] p-6 sm:p-8 shadow-xl shadow-[#1B4332]/20 relative overflow-hidden border border-[#2D6A4F]">
          <div className="absolute -right-14 -top-14 w-72 h-72 rounded-full bg-[#40916C]/30 blur-3xl pointer-events-none animate-float-slow" />
          <div className="absolute right-24 -bottom-20 w-60 h-60 rounded-full bg-[#E63946]/25 blur-3xl pointer-events-none animate-float-slow" style={{ animationDelay: '1.8s' }} />
          <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none animate-float-slow" style={{ animationDelay: '0.9s' }}>
            <AppIcon name="tooth" className="w-48 h-48 text-[#FAF7F0]" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F0]/10 border border-[#FAF7F0]/20 text-[#FAF7F0] text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse" />
                  <span>Klinik Aktif • SIM-RME Live</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E261C]/80 border border-[#2D6A4F] text-[#95D5B2] text-[11px] font-mono font-bold">
                  <AppIcon name="user-clock" className="w-3 h-3" />
                  <span>{clockText || '00:00:00'} WIB</span>
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#B7D3C4]">{dateText}</p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#FAF7F0] mt-0.5">
                  {greeting}, {activeStaffName}
                </h1>
              </div>

              <p className="text-xs text-[#D8E8DF] max-w-2xl leading-relaxed">
                Anda masuk sebagai <strong className="text-[#FAF7F0] underline decoration-[#E63946]">{activeRoleLabel}</strong>. Saat ini ada{' '}
                <strong className="text-[#FAF7F0]">{waitingCount + inProgressCount} pasien di antrean poli</strong> dan{' '}
                <strong className="text-[#FAF7F0]">{pendingPaymentCount} tagihan menunggu kasir</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
              <Link
                href="/jadwal"
                className="px-4 py-3 rounded-2xl bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 border border-[#FAF7F0]/20 text-[#FAF7F0] font-bold text-xs transition inline-flex items-center gap-2"
              >
                <AppIcon name="calendar-check" className="w-4 h-4 text-[#95D5B2]" />
                <span>Jadwal Booking</span>
              </Link>
              <Link
                href="/poli"
                className="px-5 py-3 rounded-2xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold text-xs shadow-lg shadow-[#E63946]/30 transition inline-flex items-center gap-2"
              >
                <AppIcon name="tooth" className="w-4 h-4" />
                <span>Buka Ruang Poli</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KARTU KPI UTAMA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FAF7F0] rounded-3xl border border-[#E8E1D3] shadow-xs p-5 space-y-3 hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#52796F] uppercase tracking-wider">Pasien Terdaftar</span>
              <div className="w-9 h-9 rounded-2xl bg-[#1B4332] text-[#FAF7F0] flex items-center justify-center">
                <AppIcon name="users" className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black font-mono text-[#1B4332]">{totalPatientsToday}</h3>
              <p className="text-[11px] text-[#52796F] mt-0.5">Rekam medis aktif di Prisma DB</p>
            </div>
          </div>

          <div className="bg-[#FAF7F0] rounded-3xl border border-[#E8E1D3] shadow-xs p-5 space-y-3 hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#52796F] uppercase tracking-wider">Antrean Poli Aktif</span>
              <div className="w-9 h-9 rounded-2xl bg-[#E63946]/15 text-[#E63946] flex items-center justify-center">
                <AppIcon name="clock-rotate-left" className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black font-mono text-[#E63946]">{waitingCount + inProgressCount}</h3>
              <p className="text-[11px] text-[#52796F] mt-0.5">
                {waitingCount} menunggu • {inProgressCount} di kursi gigi
              </p>
            </div>
          </div>

          <div className="bg-[#FAF7F0] rounded-3xl border border-[#E8E1D3] shadow-xs p-5 space-y-3 hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#52796F] uppercase tracking-wider">Pending Kasir</span>
              <div className="w-9 h-9 rounded-2xl bg-[#2D6A4F]/15 text-[#1B4332] flex items-center justify-center">
                <AppIcon name="cash-register" className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black font-mono text-[#1B4332]">{pendingPaymentCount}</h3>
              <p className="text-[11px] text-[#52796F] mt-0.5">Siap diproses QRIS / EDC / Tunai</p>
            </div>
          </div>

          <div className="bg-[#FAF7F0] rounded-3xl border border-[#E8E1D3] shadow-xs p-5 space-y-2.5 hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#52796F] uppercase tracking-wider">Kas Masuk Aktual</span>
              <div className="w-9 h-9 rounded-2xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center">
                <AppIcon name="wallet" className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black font-mono text-[#1B4332]">
                Rp {totalKasMasuk.toLocaleString('id-ID')}
              </h3>
              <div className="w-full h-1.5 rounded-full bg-[#E8E1D3] mt-2 overflow-hidden">
                <div className="h-full bg-[#2D6A4F] rounded-full" style={{ width: `${paidRatio}%` }} />
              </div>
              <p className="text-[10px] text-[#52796F] mt-1">
                {transactions.length} transaksi{totalPiutang > 0 ? ` • Piutang: Rp ${totalPiutang.toLocaleString('id-ID')}` : ' lunas'}
              </p>
            </div>
          </div>
        </div>

        {/* LIVE FEED ANTREAN & JADWAL BOOKING */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Antrean Live */}
          <div className="lg:col-span-7 bg-[#FAF7F0] rounded-3xl border border-[#E8E1D3] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E1D3] pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#1B4332]">Antrean Poli Hari Ini (Live)</h2>
                <p className="text-[11px] text-[#52796F]">Pasien yang sedang menunggu atau diperiksa di dental chair</p>
              </div>
              <Link href="/antrean" className="text-xs font-bold text-[#E63946] hover:underline">
                Kelola Antrean
              </Link>
            </div>

            {activeQueueList.length === 0 ? (
              <p className="text-xs text-[#52796F] py-6 text-center">Belum ada antrean aktif saat ini.</p>
            ) : (
              <div className="space-y-2.5">
                {activeQueueList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-[#F5F1E8] border border-[#E8E1D3] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 rounded-xl bg-[#1B4332] text-[#FAF7F0] font-mono font-black flex items-center justify-center">
                        {p.queueNumber}
                      </span>
                      <div>
                        <p className="font-bold text-[#1B4332]">{p.name}</p>
                        <p className="text-[10px] font-mono text-[#52796F]">
                          {p.rmNumber} • {p.age} th
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.statusKunjungan === 'Sedang Diperiksa'
                          ? 'bg-[#E63946] text-white'
                          : 'bg-white border border-[#DED6C5] text-[#1B4332]'
                      }`}
                    >
                      {p.statusKunjungan}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Jadwal Booking Mendatang */}
          <div className="lg:col-span-5 bg-[#FAF7F0] rounded-3xl border border-[#E8E1D3] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E1D3] pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#1B4332]">Booking Janji Temu</h2>
                <p className="text-[11px] text-[#52796F]">Sinkron otomatis dari Landing Page &amp; Front Office</p>
              </div>
              <Link href="/jadwal" className="text-xs font-bold text-[#E63946] hover:underline">
                Semua Jadwal
              </Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="py-6 text-center space-y-2 text-xs text-[#52796F]">
                <p>Belum ada jadwal booking mendatang.</p>
                <Link
                  href="/jadwal"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1B4332] text-[#FAF7F0] font-bold text-[11px]"
                >
                  <AppIcon name="calendar-plus" className="w-3.5 h-3.5" />
                  <span>Buat Jadwal Baru</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-[#F5F1E8] border border-[#E8E1D3] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#1B4332] truncate">{b.patient.name}</p>
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

        {/* PUSAT PINTASAN MODUL */}
        <div className="bg-[#FAF7F0] rounded-3xl border border-[#E8E1D3] shadow-xs p-6 space-y-4">
          <div className="border-b border-[#E8E1D3] pb-3">
            <h2 className="text-sm font-extrabold text-[#1B4332]">Pintasan Modul Operasional</h2>
            <p className="text-[11px] text-[#52796F]">Akses cepat seluruh fitur Yovela Dental Clinic</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { href: '/jadwal', icon: 'calendar-check', title: 'Jadwal Janji Temu', desc: 'Booking & WA reminder' },
              { href: '/pasien', icon: 'user-plus', title: 'Pendaftaran Pasien', desc: 'Pasien baru & kontrol' },
              { href: '/poli', icon: 'tooth', title: 'Pemeriksaan Poli', desc: 'Odontogram FDI & Consent' },
              { href: '/kasir', icon: 'receipt', title: 'Kasir & QRIS/EDC', desc: 'Diskon, DP & cicilan' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="p-4 rounded-2xl bg-[#F5F1E8] border border-[#E8E1D3] hover:border-[#1B4332] transition flex items-center gap-3.5 group"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#1B4332] group-hover:bg-[#E63946] text-[#FAF7F0] flex items-center justify-center transition">
                  <AppIcon name={item.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-[#1B4332]">{item.title}</h3>
                  <p className="text-[10px] text-[#52796F]">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
