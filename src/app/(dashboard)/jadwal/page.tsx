'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppIcon } from "@/components/AppIcon";
import { CustomSelect } from '@/components/CustomSelect';
import Link from 'next/link';
import { PatientRecord } from '../../../data/patientDatabase';

interface DoctorOption {
  id: string;
  name: string;
  roleLabel: string;
}

interface AppointmentItem {
  id: string;
  patientId: string;
  doctorId: string | null;
  scheduledDate: string;
  scheduledTime: string;
  durationMin: number;
  chiefComplaint: string;
  notes: string | null;
  status: 'BOOKED' | 'CONFIRMED' | 'ARRIVED' | 'CANCELLED' | 'NO_SHOW';
  reminderSent: boolean;
  patient: {
    id: string;
    name: string;
    rmNumber: string;
    phone: string;
    age: number;
    gender: string;
  };
  doctor: {
    id: string;
    name: string;
    roleLabel: string;
  } | null;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '18:30',
  '19:00', '19:30', '20:00',
];

export default function JadwalJanjiTemuPage() {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Buat Janji Temu
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(todayStr);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [durationMin, setDurationMin] = useState(30);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadData = async () => {
    try {
      const [aRes, pRes] = await Promise.all([
        fetch('/api/appointments', { cache: 'no-store' }),
        fetch('/api/patients', { cache: 'no-store' }),
      ]);
      if (aRes.ok) {
        const aData = await aRes.json();
        setAppointments(aData.appointments || []);
        const docList: DoctorOption[] = aData.doctors || [];
        setDoctors(docList);
        if (!doctorId && docList.length > 0) setDoctorId(docList[0].id);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        const pList: PatientRecord[] = pData.patients || [];
        setPatients(pList);
        if (!patientId && pList.length > 0) setPatientId(pList[0].id);
      }
    } catch (err) {
      console.error('Gagal memuat jadwal janji temu:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !scheduledDate || !scheduledTime) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          doctorId: doctorId || undefined,
          scheduledDate,
          scheduledTime,
          durationMin,
          chiefComplaint,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal membuat janji temu.');
        return;
      }

      setChiefComplaint('');
      setNotes('');
      showToast(`Janji temu berhasil dijadwalkan untuk ${data.appointment.patient.name} (${scheduledDate} ${scheduledTime}).`);
      await loadData();
    } catch {
      showToast('Gagal terhubung ke server database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (
    appt: AppointmentItem,
    status: AppointmentItem['status'],
    checkInToQueue = false
  ) => {
    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, checkInToQueue }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal memperbarui status janji temu.');
        return;
      }

      if (checkInToQueue && data.queueNumber) {
        showToast(`Check-in berhasil! ${appt.patient.name} masuk antrean poli nomor ${data.queueNumber}.`);
      } else {
        showToast(`Status janji temu ${appt.patient.name} diperbarui menjadi ${status}.`);
      }
      await loadData();
    } catch {
      showToast('Gagal terhubung ke server database.');
    }
  };

  const handleWhatsAppReminder = async (appt: AppointmentItem) => {
    const cleanPhone = appt.patient.phone.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const doctorName = appt.doctor?.name || 'drg. Yuli Kartilla Panjaitan';
    const text = encodeURIComponent(
      `Halo ${appt.patient.name}, kami dari Yovela Dental Clinic mengingatkan jadwal janji temu Anda pada tanggal ${appt.scheduledDate} pukul ${appt.scheduledTime} WIB bersama ${doctorName}. Mohon konfirmasi kehadiran Anda. Terima kasih!`
    );
    window.open(`https://wa.me/${waPhone}?text=${text}`, '_blank', 'noopener,noreferrer');

    try {
      await fetch(`/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderSent: true }),
      });
      await loadData();
    } catch {}
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchDate = !filterDate || a.scheduledDate === filterDate;
      const matchStatus = filterStatus === 'ALL' || a.status === filterStatus;
      return matchDate && matchStatus;
    });
  }, [appointments, filterDate, filterStatus]);

  const stats = useMemo(() => {
    const todayTotal = appointments.filter((a) => a.scheduledDate === todayStr && a.status !== 'CANCELLED').length;
    const booked = appointments.filter((a) => a.status === 'BOOKED').length;
    const confirmed = appointments.filter((a) => a.status === 'CONFIRMED').length;
    const arrived = appointments.filter((a) => a.status === 'ARRIVED').length;
    return { todayTotal, booked, confirmed, arrived };
  }, [appointments, todayStr]);

  const statusBadge = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ARRIVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
      case 'NO_SHOW':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-slate-800 font-['Poppins',sans-serif] flex flex-col antialiased pb-12 w-full">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs font-semibold">
          <div className="w-6 h-6 rounded-full bg-[#1B4332] text-[#FAF7F0] flex items-center justify-center text-xs">
            <AppIcon name="calendar-check" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SUB-BAR JUDUL & RINGKASAN */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-3.5">
        <div className="max-w-[1440px] w-full mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900">Jadwal Janji Temu Dokter (Booking)</h1>
            <p className="text-[10px] text-slate-400 font-medium">Manajemen slot praktek, pengingat WhatsApp, dan check-in otomatis ke antrean poli</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
              Hari Ini: <strong>{stats.todayTotal}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-[11px]">
              Booked: <strong>{stats.booked}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[11px]">
              Terkonfirmasi: <strong>{stats.confirmed}</strong>
            </span>
            <Link
              href="/antrean"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <AppIcon name="clock-rotate-left" className="text-[#2D6A4F] text-[11px]" />
              <span>Lihat Antrean Poli</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI (5 Kolom): FORM BOOKING BARU */}
          <div className="lg:col-span-5">
            <form onSubmit={handleCreateAppointment} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4 text-xs">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center text-xs">
                  <AppIcon name="calendar-plus" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Buat Jadwal Janji Temu</h2>
                  <p className="text-[10px] text-slate-400">Otomatis mencegah bentrok slot jam dokter</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Pasien Terdaftar *</label>
                <CustomSelect
                  searchable
                  value={patientId}
                  onChange={setPatientId}
                  options={patients.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.rmNumber})`,
                    sublabel: p.phone,
                  }))}
                  placeholder="Pilih pasien terdaftar..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dokter Pemeriksa</label>
                <CustomSelect
                  value={doctorId}
                  onChange={setDoctorId}
                  options={doctors.map((d) => ({
                    value: d.id,
                    label: d.name,
                    sublabel: d.roleLabel,
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Kunjungan *</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-[#FAF7F0] border border-[#DED6C5] rounded-xl px-3 py-2 text-[#1B4332] font-semibold focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Slot Jam *</label>
                  <CustomSelect
                    value={scheduledTime}
                    onChange={setScheduledTime}
                    options={TIME_SLOTS.map((slot) => ({ value: slot, label: `${slot} WIB` }))}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimasi Durasi Tindakan</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 45, 60].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setDurationMin(min)}
                      className={`py-2 rounded-xl border font-bold transition cursor-pointer ${
                        durationMin === min
                          ? 'bg-[#1B4332]/10 border-[#1B4332] text-[#1B4332]'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {min} Menit
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rencana Tindakan / Keluhan Utama</label>
                <input
                  type="text"
                  placeholder="Contoh: Kontrol behel bulanan, scaling, atau tambal gigi 16..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-[#1B4332] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Pasien meminta foto rontgen periapikal..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[#1B4332] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <AppIcon name="calendar-check" />
                <span>{isSubmitting ? 'Menyimpan Jadwal...' : 'Simpan Jadwal Janji Temu'}</span>
              </button>
            </form>
          </div>

          {/* KOLOM KANAN (7 Kolom): DAFTAR JADWAL JANJI TEMU */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Daftar Jadwal Terdaftar ({filteredAppointments.length})</h2>
                <p className="text-[10px] text-slate-400">Klik Check-in saat pasien tiba untuk otomatis membuat antrean poli</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:border-[#1B4332]"
                />
                <div className="w-44">
                  <CustomSelect
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={[
                      { value: 'ALL', label: 'Semua Status' },
                      { value: 'BOOKED', label: 'Booked' },
                      { value: 'CONFIRMED', label: 'Confirmed' },
                      { value: 'ARRIVED', label: 'Arrived (Check-in)' },
                      { value: 'CANCELLED', label: 'Cancelled' },
                    ]}
                  />
                </div>
                {(filterDate || filterStatus !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterDate('');
                      setFilterStatus('ALL');
                    }}
                    className="text-rose-600 font-semibold underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredAppointments.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                  <AppIcon name="calendar-xmark" className="text-3xl text-slate-300 block" />
                  <p>Belum ada jadwal janji temu untuk filter ini.</p>
                </div>
              ) : (
                filteredAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 py-2 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs shrink-0">
                        <span className="block font-mono font-black text-sm text-[#1B4332]">{appt.scheduledTime}</span>
                        <span className="block text-[9px] text-slate-400 font-mono">{appt.scheduledDate}</span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-slate-900 font-bold">{appt.patient.name}</strong>
                          <span className="text-[10px] font-mono text-slate-400">{appt.patient.rmNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusBadge(appt.status)}`}>
                            {appt.status}
                          </span>
                          {appt.reminderSent && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              WA Terkirim
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{appt.chiefComplaint}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {appt.doctor?.name || 'drg. Yuli Kartilla Panjaitan'} • {appt.durationMin} menit • {appt.patient.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleWhatsAppReminder(appt)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                        title="Kirim pengingat via WhatsApp"
                      >
                        <AppIcon name="whatsapp" />
                        <span>WA</span>
                      </button>

                      {appt.status === 'BOOKED' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(appt, 'CONFIRMED')}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[11px] transition cursor-pointer"
                        >
                          Konfirmasi
                        </button>
                      )}

                      {(appt.status === 'BOOKED' || appt.status === 'CONFIRMED') && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt, 'ARRIVED', true)}
                            className="px-3 py-1.5 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                          >
                            <AppIcon name="ticket" className="text-[10px]" />
                            <span>Check-in Poli</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt, 'CANCELLED')}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 font-bold text-[11px] transition cursor-pointer"
                          >
                            Batal
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
