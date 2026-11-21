'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppIcon } from "@/components/AppIcon";
import Link from 'next/link';
import { 
  getStoredPatients, 
  saveStoredPatients, 
  setActivePatient, 
  PatientRecord 
} from '../../../data/patientDatabase';
import { useAuth } from '../../../context/AuthContext';

export default function AntreanPoliPage() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Menunggu' | 'Sedang Diperiksa' | 'Menunggu Pembayaran' | 'Selesai'>('ALL');
  const [callingId, setCallingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Identitas Staf / Dokter Penanggung Jawab
  const currentDoctorName = 'drg. Yuli Kartilla Panjaitan';

  // Muat data antrean dari database via API
  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/patients', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (err) {
      console.error('Gagal memuat antrean:', err);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Update Status Pasien & Simpan ke Database via API
  const updatePatientStatus = async (patientId: string, newStatus: PatientRecord['statusKunjungan']) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target?.encounterId) return;

    try {
      const res = await fetch(`/api/encounters/${target.encounterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusKunjungan: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToastMessage(data.error || 'Gagal memperbarui status kunjungan.');
        setTimeout(() => setToastMessage(''), 3000);
        return;
      }

      const updatedPatient: PatientRecord = data.patient;
      if (newStatus === 'Sedang Diperiksa') {
        setActivePatient(updatedPatient);
      }
      setPatients((prev) => prev.map((p) => (p.id === patientId ? updatedPatient : p)));
      setToastMessage(`Status pasien berhasil diubah menjadi: ${newStatus}`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch {
      setToastMessage('Gagal terhubung ke server database.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  // Fungsi Panggil Pasien (Web Speech API + Sinkronisasi Display TV)
  const handleCallPatient = (patient: PatientRecord) => {
    setCallingId(patient.id);

    // 1. Broadcast ke Display TV Monitor via Database API (lintas komputer/Wi-Fi) & localStorage
    const callPayload = {
      queueNumber: patient.queueNumber,
      patientName: patient.name,
      roomName: 'Ruang Tindakan 01',
      doctorName: currentDoctorName,
      timestamp: Date.now(),
    };
    localStorage.setItem('yovela_calling_queue', JSON.stringify(callPayload));
    fetch('/api/queue/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callPayload),
    }).catch(() => {});

    // 2. Bunyikan Panggilan Suara Otomatis jika browser mendukung
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Hentikan ucapan sebelumnya
      const textToSpeak = `Nomor antrean, ${patient.queueNumber}, ${patient.name}, silakan menuju Ruang Tindakan 01.`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }

    setToastMessage(`Memanggil nomor antrean ${patient.queueNumber} - ${patient.name}`);
    setTimeout(() => {
      setCallingId(null);
      setToastMessage('');
    }, 3500);
  };

  // Hitung Statistik Antrean
  const stats = useMemo(() => {
    const waiting = patients.filter((p) => p.statusKunjungan === 'Menunggu').length;
    const inProgress = patients.filter((p) => p.statusKunjungan === 'Sedang Diperiksa').length;
    const billing = patients.filter((p) => p.statusKunjungan === 'Menunggu Pembayaran').length;
    const done = patients.filter((p) => p.statusKunjungan === 'Selesai').length;
    return { waiting, inProgress, billing, done, total: patients.length };
  }, [patients]);

  // Filter Pasien
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.queueNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.rmNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'ALL' || p.statusKunjungan === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [patients, searchQuery, statusFilter]);

  // Pasien yang sedang aktif diperiksa
  const currentActivePatient = patients.find((p) => p.statusKunjungan === 'Sedang Diperiksa');

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-slate-800 font-['Poppins',sans-serif] flex flex-col antialiased pb-12">
      {/* 1. SUB-BAR AKSI ANTREAN (Tanpa Double Header) */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-3">
        <div className="max-w-[1440px] w-full mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900">Antrean Hari Ini</h1>
            <p className="text-[10px] text-slate-400 font-medium">Instalasi Antrean Poli Gigi • Ruang Tindakan 01</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/pasien"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-[#1B4332] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <AppIcon name="user-plus" className="text-[#1B4332]" />
              <span>Daftar Pasien Baru</span>
            </Link>
            <Link
              href="/display-antrean"
              target="_blank"
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <AppIcon name="tv" className="text-[#2D6A4F] text-xs" />
              <span>Buka Display TV</span>
            </Link>
          </div>
        </div>
      </div>

      {/* TOAST SUKSES MENGAMBANG */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700 text-xs font-semibold">
          <div className="w-6 h-6 rounded-full bg-[#1B4332] text-[#FAF7F0] flex items-center justify-center text-xs">
            <AppIcon name="bell" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. STATISTIK KARTU ANTREAN BERGAYA YOVELA */}
      <section className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-4 shadow-2xs">
        <div className="max-w-[1440px] w-full mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch">
          {/* Menunggu */}
          <div 
            onClick={() => setStatusFilter('Menunggu')}
            className={`h-full flex flex-col justify-between p-3.5 rounded-2xl border transition duration-150 cursor-pointer ${
              statusFilter === 'Menunggu'
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300/40'
                : 'bg-slate-50/70 border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Menunggu</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            </div>
            <h3 className="text-2xl font-black font-mono text-amber-600 mt-1">{stats.waiting}</h3>
            <p className="text-[10px] text-slate-500 mt-auto pt-1">Pasien di ruang tunggu</p>
          </div>

          {/* Sedang Diperiksa */}
          <div 
            onClick={() => setStatusFilter('Sedang Diperiksa')}
            className={`h-full flex flex-col justify-between p-3.5 rounded-2xl border transition duration-150 cursor-pointer ${
              statusFilter === 'Sedang Diperiksa'
                ? 'bg-[#1B4332]/10 border-[#1B4332] ring-2 ring-[#1B4332]/30'
                : 'bg-slate-50/70 border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Sedang Diperiksa</span>
              <span className="w-2 h-2 rounded-full bg-[#1B4332]" />
            </div>
            <h3 className="text-2xl font-black font-mono text-[#1B4332] mt-1">{stats.inProgress}</h3>
            <p className="text-[10px] text-slate-500 mt-auto pt-1 truncate">
              {currentActivePatient ? currentActivePatient.name : 'Tidak ada pasien di dental chair'}
            </p>
          </div>

          {/* Menunggu Pembayaran (Kasir) */}
          <div 
            onClick={() => setStatusFilter('Menunggu Pembayaran')}
            className={`h-full flex flex-col justify-between p-3.5 rounded-2xl border transition duration-150 cursor-pointer ${
              statusFilter === 'Menunggu Pembayaran'
                ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-300/40'
                : 'bg-slate-50/70 border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Kasir / Billing</span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <h3 className="text-2xl font-black font-mono text-blue-600 mt-1">{stats.billing}</h3>
            <p className="text-[10px] text-slate-500 mt-auto pt-1">Menunggu struk pembayaran</p>
          </div>

          {/* Selesai */}
          <div 
            onClick={() => setStatusFilter('Selesai')}
            className={`h-full flex flex-col justify-between p-3.5 rounded-2xl border transition duration-150 cursor-pointer ${
              statusFilter === 'Selesai'
                ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-300/40'
                : 'bg-slate-50/70 border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Selesai Kunjungan</span>
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            </div>
            <h3 className="text-2xl font-black font-mono text-emerald-700 mt-1">{stats.done}</h3>
            <p className="text-[10px] text-slate-500 mt-auto pt-1">Pemeriksaan rampung</p>
          </div>
        </div>
      </section>

      {/* 3. WORKSPACE DAFTAR ANTREAN */}
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* KOLOM KIRI (8 Kolom): DAFTAR TABEL ANTREAN INTERAKTIF */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            {/* Toolbar Pencarian & Filter Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Manajemen Antrean Poli Gigi</h2>
                <p className="text-[11px] text-slate-400">Panggil ke display TV dan perbarui status kunjungan pasien</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <input
                    type="text"
                    placeholder="Cari No. Antrean, Nama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1B4332] focus:bg-white transition"
                  />
                  <AppIcon name="magnifying-glass" className="text-slate-400 text-xs absolute left-2.5 top-2.5" />
                </div>

                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({stats.total})
                </button>
              </div>
            </div>

            {/* List Antrean Pasien */}
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredPatients.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                  <AppIcon name="user-clock" className="text-3xl text-slate-300 block mb-1" />
                  <p>Tidak ada pasien dalam kategori antrean ini.</p>
                </div>
              ) : (
                filteredPatients.map((patient) => {
                  const isCalling = callingId === patient.id;
                  const isCurrentlyExamined = patient.statusKunjungan === 'Sedang Diperiksa';

                  return (
                    <div
                      key={patient.id}
                      className={`p-4 rounded-2xl border transition duration-150 flex flex-wrap items-center justify-between gap-3 ${
                        isCurrentlyExamined
                          ? 'bg-[#1B4332]/10 border-[#1B4332] shadow-xs'
                          : isCalling
                          ? 'bg-amber-50 border-amber-300 animate-pulse'
                          : 'bg-slate-50/60 border-slate-200 hover:border-[#1B4332]/60 hover:bg-white'
                      }`}
                    >
                      {/* Informasi Pasien & Nomor Tiket */}
                      <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-sm border shadow-2xs ${
                          isCurrentlyExamined
                            ? 'bg-[#1B4332] text-[#FAF7F0] border-[#20b88f]'
                            : 'bg-white text-[#1B4332] border-slate-200'
                        }`}>
                          <span className="text-[8px] tracking-wider opacity-75">ANTRE</span>
                          <span>{patient.queueNumber}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{patient.name}</h4>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              ({patient.age} th, {patient.gender === 'Laki-laki' ? 'L' : 'P'})
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              patient.statusKunjungan === 'Menunggu'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : patient.statusKunjungan === 'Sedang Diperiksa'
                                ? 'bg-[#1B4332]/15 text-[#1B4332] border-[#1B4332]/40'
                                : patient.statusKunjungan === 'Menunggu Pembayaran'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {patient.statusKunjungan}
                            </span>
                          </div>

                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {patient.rmNumber} • Keluhan: {patient.lastSoap?.subjective || 'Pemeriksaan rutin'}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            Didaftarkan oleh: <strong>{patient.registeredBy || 'Front Office'}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Tombol Interaktif Tindakan Antrean */}
                      <div className="flex items-center gap-1.5">
                        {/* Tombol Panggil Suara / TV */}
                        <button
                          type="button"
                          onClick={() => handleCallPatient(patient)}
                          disabled={isCalling}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer shadow-2xs ${
                            isCalling
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-[#1B4332] hover:text-[#1B4332]'
                          }`}
                        >
                          <AppIcon name={isCalling ? "volume-high" : "bullhorn"} className={isCalling ? "animate-bounce text-[11px]" : "text-[11px]"} />
                          <span>{isCalling ? 'Memanggil...' : 'Panggil'}</span>
                        </button>

                        {/* Tombol Mulai Periksa */}
                        {patient.statusKunjungan === 'Menunggu' && (
                          <button
                            type="button"
                            onClick={() => updatePatientStatus(patient.id, 'Sedang Diperiksa')}
                            className="px-3 py-1.5 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                          >
                            <AppIcon name="tooth" className="text-[11px]" />
                            <span>Mulai Periksa</span>
                          </button>
                        )}

                        {/* Tombol Buka Rekam Medis Poli */}
                        {patient.statusKunjungan === 'Sedang Diperiksa' && (
                          <Link
                            href="/poli"
                            onClick={() => setActivePatient(patient)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <AppIcon name="notes-medical" className="text-[#2D6A4F] text-[11px]" />
                            <span>Buka Odontogram</span>
                          </Link>
                        )}

                        {/* Selesaikan Poli & Arahkan ke Kasir */}
                        {patient.statusKunjungan === 'Sedang Diperiksa' && (
                          <button
                            type="button"
                            onClick={() => updatePatientStatus(patient.id, 'Menunggu Pembayaran')}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1"
                            title="Selesaikan tindakan dan teruskan tagihan ke kasir"
                          >
                            <AppIcon name="arrow-right" className="text-[10px]" />
                            <span>Ke Kasir</span>
                          </button>
                        )}

                        {/* Arahkan ke Kasir agar transaksi tercatat resmi */}
                        {patient.statusKunjungan === 'Menunggu Pembayaran' && (
                          <Link
                            href="/kasir"
                            onClick={() => setActivePatient(patient)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1"
                            title="Buka loket kasir untuk memproses pembayaran"
                          >
                            <AppIcon name="cash-register" className="text-[10px]" />
                            <span>Proses Kasir</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* KOLOM KANAN (4 Kolom): PANEL PANGGILAN AKTIF & STATUS RUANG PERIKSA */}
          <div className="lg:col-span-4 space-y-4">
            {/* Kartu Status Ruang Periksa 01 */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#1B4332]/10 pointer-events-none" />

              <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#1B4332]/10 text-[#2D6A4F] flex items-center justify-center text-xs">
                    <AppIcon name="door-open" />
                  </div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Ruang Tindakan 01</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  currentActivePatient 
                    ? 'bg-[#1B4332]/10 text-[#1B4332]' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {currentActivePatient ? 'TERISI' : 'RUANG KOSONG'}
                </span>
              </div>

              {/* Display Pasien di Kursi Gigi */}
              <div className="text-center py-5 bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200/90 my-2 shadow-inner">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Pasien di Dental Chair
                </span>
                <h2 className="text-5xl font-black font-mono text-[#1B4332] tracking-tight">
                  {currentActivePatient?.queueNumber || '---'}
                </h2>
                <h4 className="text-sm font-bold text-slate-900 mt-2 truncate px-3">
                  {currentActivePatient?.name || 'Menunggu Pasien Masuk'}
                </h4>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {currentActivePatient?.rmNumber || 'Poli Siap Melayani'}
                </p>
              </div>

              {/* Detail Poli */}
              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">Dokter Praktek:</span>
                  <span className="font-semibold text-slate-800">{currentDoctorName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">Status Dental Chair:</span>
                  <span className="font-semibold text-slate-800">
                    {currentActivePatient ? 'Sedang Tindakan Klinis' : 'Steril & Siap'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Antrean Selanjutnya:</span>
                  <span className="font-semibold text-[#1B4332]">
                    {patients.find((p) => p.statusKunjungan === 'Menunggu')?.queueNumber || 'Tidak ada'}
                  </span>
                </div>
              </div>

              {/* Tombol Tindakan Cepat */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                {currentActivePatient ? (
                  <Link
                    href="/poli"
                    onClick={() => setActivePatient(currentActivePatient)}
                    className="flex-1 py-2.5 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <AppIcon name="tooth" className="text-xs" />
                    <span>Periksa di Odontogram</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const nextPatient = patients.find((p) => p.statusKunjungan === 'Menunggu');
                      if (nextPatient) {
                        handleCallPatient(nextPatient);
                        updatePatientStatus(nextPatient.id, 'Sedang Diperiksa');
                      } else {
                        setToastMessage('Tidak ada pasien yang sedang menunggu.');
                        setTimeout(() => setToastMessage(''), 2500);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <AppIcon name="forward-step" className="text-xs" />
                    <span>Panggil Antrean Berikutnya</span>
                  </button>
                )}
              </div>
            </div>

            {/* Widget Panduan Display TV */}
            <div className="bg-[#1B4332]/10 border border-[#1B4332]/30 rounded-3xl p-4 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-[#1B4332]/15 text-[#1B4332] flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-2xs">
                <AppIcon name="satellite-dish" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-slate-800">Sinkronisasi Display TV Monitor</h4>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                  Tombol <strong>Panggil</strong> otomatis membunyikan suara bel dan memperbarui tampilan nomor antrean di layar TV ruang tunggu secara *real-time*.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}