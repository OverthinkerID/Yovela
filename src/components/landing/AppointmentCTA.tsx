'use client';

import React, { useState } from 'react';
import { CalendarCheck, MessageCircle, CheckCircle2 } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landingConfig';
import { CustomSelect } from '../CustomSelect';
import { useToast } from '../../context/ToastContext';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '19:00', '19:30',
];

export const AppointmentCTA: React.FC = () => {
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [scheduledDate, setScheduledDate] = useState(todayStr);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [serviceName, setServiceName] = useState(LANDING_CONFIG.treatments[0].title);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    patientName: string;
    rmNumber: string;
    scheduledDate: string;
    scheduledTime: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBookingResult(null);

    try {
      const res = await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          scheduledDate,
          scheduledTime,
          serviceName,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan jadwal booking.', 'error');
        return;
      }
      setBookingResult(data.booking);
      showToast('Jadwal kunjungan Anda berhasil terdaftar!', 'success');
      setName('');
      setPhone('');
      setNotes('');
    } catch {
      showToast('Gagal terhubung ke server klinik.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappUrl = `https://wa.me/${LANDING_CONFIG.appointmentCta.whatsappNumber}?text=${encodeURIComponent(
    'Halo Yovela Dental Clinic, saya ingin berkonsultasi dan membuat janji temu perawatan gigi.'
  )}`;

  return (
    <section
      id="appointment"
      className="bg-[#234B38] text-[#F3EBDD] py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#E65B45]/18 blur-3xl"
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start relative z-10">
        {/* Kiri: Editorial CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2.5">
            <span className="w-6 h-[2px] bg-[#E65B45] rounded-full" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F3EBDD]/80">
              Appointment
            </span>
          </div>

          <h2 className="gsap-text-reveal font-editorial text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
            {LANDING_CONFIG.appointmentCta.headline}
          </h2>

          <p className="text-sm sm:text-base text-[#F3EBDD]/80 leading-relaxed">
            {LANDING_CONFIG.appointmentCta.subheadline}
          </p>

          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#F3EBDD] hover:bg-[#E65B45] text-[#234B38] hover:text-[#FAF6EE] text-xs sm:text-sm font-bold transition-colors duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Konsultasi via WhatsApp Klinik</span>
            </a>
          </div>
        </div>

        {/* Kanan: Form Booking Online Terhubung ke Aplikasi Klinik */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="bg-[#FAF6EE] text-[#234B38] rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-4 text-xs"
          >
            {bookingResult && (
              <div className="p-4 rounded-2xl bg-[#234B38] text-[#F3EBDD] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#E65B45] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Booking Terdaftar — {bookingResult.rmNumber}</p>
                  <p className="text-[11px] text-[#F3EBDD]/80 mt-0.5">
                    {bookingResult.patientName} • {bookingResult.scheduledDate} pukul {bookingResult.scheduledTime} WIB
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1.5">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap Anda..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#DFD4C0] bg-white font-semibold outline-none focus:border-[#234B38]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5">Nomor WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="08xx-xxxx-xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#DFD4C0] bg-white font-mono font-semibold outline-none focus:border-[#234B38]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1.5">Tanggal Kunjungan *</label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#DFD4C0] bg-white font-semibold outline-none focus:border-[#234B38]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5">Pilih Jam *</label>
                <CustomSelect
                  value={scheduledTime}
                  onChange={setScheduledTime}
                  options={TIME_SLOTS.map((t) => ({ value: t, label: `${t} WIB` }))}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1.5">Pilih Layanan Perawatan *</label>
              <CustomSelect
                value={serviceName}
                onChange={setServiceName}
                options={LANDING_CONFIG.treatments.map((t) => ({ value: t.title, label: t.title }))}
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5">Catatan Keluhan (Opsional)</label>
              <textarea
                rows={2}
                placeholder="Keluhan singkat atau preferensi jadwal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-[#DFD4C0] bg-white outline-none focus:border-[#234B38]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-full bg-[#E65B45] hover:bg-[#CC4631] text-[#FAF6EE] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-[#E65B45]/25 cursor-pointer transition disabled:opacity-60"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses Jadwal...' : 'Konfirmasi Booking Appointment'}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
