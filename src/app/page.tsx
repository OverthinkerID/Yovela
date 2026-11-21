'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppIcon } from '@/components/AppIcon';
import { CustomSelect } from '@/components/CustomSelect';
import { useToast } from '@/context/ToastContext';

interface TestimonialItem {
  id: string;
  patientName: string;
  serviceName: string;
  rating: number;
  comment: string;
  source: 'CLINIC_APP' | 'GOOGLE_REVIEW';
  createdAt: string;
}

const SERVICE_CARDS = [
  {
    title: 'Pemeriksaan & Preventif',
    price: 'Mulai Rp 100.000',
    desc: 'Konsultasi intraoral menyeluruh, pemetaan Odontogram Digital FDI, rontgen periapikal, dan aplikasi fluor.',
    icon: 'tooth',
  },
  {
    title: 'Scaling & Perawatan Gusi',
    price: 'Mulai Rp 300.000',
    desc: 'Pembersihan karang gigi ultrasonik supragingival & subgingival yang lembut tanpa rasa ngilu berlebih.',
    icon: 'shield-halved',
  },
  {
    title: 'Tambal Estetik & Saluran Akar',
    price: 'Mulai Rp 280.000',
    desc: 'Restorasi komposit sewarna gigi asli (nano-hybrid) serta perawatan saluran akar (PSA) terukur.',
    icon: 'notes-medical',
  },
  {
    title: 'Bedah Mulut & Odontektomi',
    price: 'Mulai Rp 250.000',
    desc: 'Pencabutan gigi tanpa komplikasi hingga operasi gigi bungsu impaksi dengan sterilisasi autoclave ketat.',
    icon: 'user-doctor',
  },
  {
    title: 'Estetika, Veneer & Bleaching',
    price: 'Mulai Rp 1.800.000',
    desc: 'Pemutihan gigi laser in-office, mahkota Zirconia premium, hingga Porcelain Veneer untuk senyum natural.',
    icon: 'circle-check',
  },
  {
    title: 'Ortodonti (Behel & Retainer)',
    price: 'Tersedia Cicilan DP',
    desc: 'Pemasangan behel metal maupun sapphire estetik dengan jadwal kontrol rutin dan skema pembayaran bertahap.',
    icon: 'calendar-check',
  },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '19:00', '19:30',
];

export default function LandingPage() {
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().slice(0, 10);

  // Booking State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [scheduledDate, setScheduledDate] = useState(todayStr);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [serviceName, setServiceName] = useState('Konsultasi & Pemeriksaan Gigi');
  const [notes, setNotes] = useState('');
  const [bookingResult, setBookingResult] = useState<{
    patientName: string;
    rmNumber: string;
    scheduledDate: string;
    scheduledTime: string;
    doctorName: string;
  } | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Testimoni State
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [avgRating, setAvgRating] = useState(5.0);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    'https://www.google.com/maps/search/?api=1&query=Yovela+Dental+Clinic+Semarang'
  );
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [revName, setRevName] = useState('');
  const [revService, setRevService] = useState('Scaling & Polishing Ultrasonik');
  const [revRating, setRevRating] = useState('5');
  const [revComment, setRevComment] = useState('');
  const [revSuccess, setRevSuccess] = useState('');

  const loadTestimonials = async () => {
    try {
      const res = await fetch('/api/public/testimonials', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data.testimonials || []);
        if (data.stats?.averageRating) setAvgRating(data.stats.averageRating);
        if (data.stats?.googleMapsReviewUrl) setGoogleReviewUrl(data.stats.googleMapsReviewUrl);
      }
    } catch {}
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingResult(null);
    setIsBooking(true);

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
        const msg = data.error || 'Gagal memproses booking.';
        setBookingError(msg);
        showToast(msg, 'error');
        return;
      }
      setBookingResult(data.booking);
      showToast('Booking jadwal Anda berhasil terdaftar di sistem klinik!', 'success');
      setName('');
      setPhone('');
      setNotes('');
    } catch {
      const msg = 'Gagal terhubung ke server klinik.';
      setBookingError(msg);
      showToast(msg, 'error');
    } finally {
      setIsBooking(false);
    }
  };

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevSuccess('');
    try {
      const res = await fetch('/api/public/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: revName,
          serviceName: revService,
          rating: Number(revRating),
          comment: revComment,
          source: 'CLINIC_APP',
        }),
      });
      if (res.ok) {
        setRevName('');
        setRevComment('');
        setShowReviewForm(false);
        setRevSuccess('Terima kasih! Testimoni Anda telah diterbitkan.');
        showToast('Terima kasih! Testimoni Anda telah diterbitkan.', 'success');
        await loadTestimonials();
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#1B4332] flex flex-col">
      {/* FLOATING GLASS NAVBAR */}
      <header className="sticky top-3 z-40 px-4">
        <div className="max-w-7xl mx-auto bg-[#FAF7F0]/90 backdrop-blur-xl border border-[#DED6C5] rounded-2xl px-5 py-3 shadow-sm flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1B4332] text-[#FAF7F0] flex items-center justify-center shadow-xs">
              <svg viewBox="0 0 512 512" className="w-5 h-5 fill-[#FAF7F0]">
                <path d="M416 112c-35.3 0-64 28.7-64 64v51.2c0 23.4-12.2 44.9-32.3 56.8L272 312.6l-47.7-28.6c-20.1-12-32.3-33.5-32.3-56.8V176c0-35.3-28.7-64-64-64S64 140.7 64 176c0 86.8 52.3 162.7 128 193.3V432c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V369.3c75.7-30.6 128-106.5 128-193.3c0-35.3-28.7-64-64-64z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-sm text-[#1B4332] block leading-none">Yovela Dental Clinic</span>
              <span className="text-[10px] text-[#52796F] font-semibold">Perawatan Gigi Modern &amp; Terpercaya</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#2D6A4F]">
            <a href="#profil" className="hover:text-[#E63946] transition">Profil Klinik</a>
            <a href="#dokter" className="hover:text-[#E63946] transition">Dokter</a>
            <a href="#layanan" className="hover:text-[#E63946] transition">Layanan</a>
            <a href="#testimoni" className="hover:text-[#E63946] transition">Testimoni</a>
            <a href="#booking" className="hover:text-[#E63946] transition">Booking Online</a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#1B4332]/25 bg-white hover:bg-[#1B4332] hover:text-[#FAF7F0] text-[#1B4332] text-xs font-bold transition"
            >
              <span>Google Reviews</span>
              <AppIcon name="arrow-up-right-from-square" className="w-3 h-3" />
            </a>
            <a
              href="#booking"
              className="px-4 py-2 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white text-xs font-bold shadow-sm shadow-[#E63946]/25 transition"
            >
              Buat Janji
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B4332]/10 border border-[#1B4332]/20 text-[#1B4332] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse" />
              <span>Rekam Medis Digital FDI &amp; Integrasi SATUSEHAT Kemenkes RI</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#1B4332] leading-[1.15] tracking-tight">
              Senyum Sehat &amp; Nyaman Bersama{' '}
              <span className="text-[#E63946]">Yovela Dental Clinic</span>
            </h1>

            <p className="text-sm sm:text-base text-[#3A5A40] leading-relaxed max-w-2xl">
              Klinik gigi modern di Semarang yang menggabungkan keahlian klinis{' '}
              <strong>drg. Yuli Kartilla Panjaitan</strong>, sterilisasi berstandar medis, pemetaan
              odontogram digital transparan, serta kemudahan booking online langsung terhubung ke ruang praktek.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="#booking"
                className="px-6 py-3.5 rounded-2xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#E63946]/25 transition inline-flex items-center gap-2"
              >
                <AppIcon name="calendar-check" className="w-4 h-4" />
                <span>Booking Jadwal Sekarang</span>
              </a>
              <a
                href="#layanan"
                className="px-6 py-3.5 rounded-2xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] font-bold text-xs sm:text-sm transition inline-flex items-center gap-2"
              >
                <AppIcon name="tooth" className="w-4 h-4" />
                <span>Lihat Daftar Layanan</span>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg border-t border-[#DED6C5]">
              <div>
                <p className="text-2xl font-black font-mono text-[#1B4332]">{avgRating}/5</p>
                <p className="text-[11px] text-[#52796F] font-semibold">Rating Pasien</p>
              </div>
              <div>
                <p className="text-2xl font-black font-mono text-[#1B4332]">30+</p>
                <p className="text-[11px] text-[#52796F] font-semibold">Prosedur Gigi</p>
              </div>
              <div>
                <p className="text-2xl font-black font-mono text-[#E63946]">0 Antre</p>
                <p className="text-[11px] text-[#52796F] font-semibold">Booking Terjadwal</p>
              </div>
            </div>
          </div>

          {/* KARTU VISUAL KLINIK (FOREST GREEN) */}
          <div className="lg:col-span-5">
            <div className="bg-[#1B4332] text-[#FAF7F0] rounded-[32px] p-7 shadow-2xl shadow-[#1B4332]/25 border border-[#2D6A4F] space-y-5 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[#E63946]/20 blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <span className="px-3 py-1 rounded-full bg-[#FAF7F0]/10 border border-[#FAF7F0]/20 text-[10px] font-bold uppercase tracking-wider">
                  Jam Operasional Klinik
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#95D5B2]">
                  <span className="w-2 h-2 rounded-full bg-[#95D5B2] animate-ping" />
                  Buka Hari Ini
                </span>
              </div>

              <div className="space-y-2.5 text-xs relative z-10">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-[#B7D3C4]">Senin – Jumat</span>
                  <strong className="font-mono">09:00 – 20:00 WIB</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-[#B7D3C4]">Sabtu</span>
                  <strong className="font-mono">09:00 – 17:00 WIB</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-[#B7D3C4]">Lokasi Klinik</span>
                  <strong className="text-right">Jl. Pemuda No. 45, Semarang</strong>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#B7D3C4]">Pembayaran</span>
                  <strong>QRIS, EDC Debit, Tunai &amp; Cicilan</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E261C] border border-[#2D6A4F] flex items-center gap-3.5 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#E63946] text-white flex items-center justify-center shrink-0">
                  <AppIcon name="user-doctor" className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#FAF7F0]">drg. Yuli Kartilla Panjaitan</p>
                  <p className="text-[10px] text-[#95D5B2] font-mono">SIP.503/449/DRG/2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROFIL KLINIK & KEUNGGULAN */}
      <section id="profil" className="bg-[#FAF7F0] border-y border-[#E8E1D3] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E63946]">Tentang Yovela Dental</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1B4332]">Standar Klinik Gigi Modern yang Transparan</h2>
            <p className="text-xs sm:text-sm text-[#3A5A40] leading-relaxed">
              Setiap pasien mendapatkan penjelasan visual kondisi gigi melalui papan Odontogram Digital FDI,
              estimasi biaya sebelum tindakan, serta rekam medis elektronik aman yang terjaga lintas kunjungan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: 'tooth', title: 'Odontogram Digital FDI', desc: 'Visualisasi kondisi setiap gigi secara akurat dan tersimpan sebagai riwayat kunjungan.' },
              { icon: 'shield-halved', title: 'Sterilisasi Medis Ketat', desc: 'Instrumen disterilkan dengan standar autoclave dan protokol pencegahan infeksi modern.' },
              { icon: 'qrcode', title: 'QRIS, EDC & Cicilan DP', desc: 'Transaksi cepat dengan QRIS dinamis, mesin EDC, serta skema cicilan ortodonti transparan.' },
              { icon: 'hospital', title: 'Siap Bridging SATUSEHAT', desc: 'Struktur rekam medis ICD-10 & ICD-9-CM terstandarisasi Kemenkes Republik Indonesia.' },
            ].map((feat) => (
              <div key={feat.title} className="p-6 rounded-3xl bg-[#F5F1E8] border border-[#E8E1D3] space-y-3 hover-lift">
                <div className="w-11 h-11 rounded-2xl bg-[#1B4332] text-[#FAF7F0] flex items-center justify-center">
                  <AppIcon name={feat.icon} className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1B4332]">{feat.title}</h3>
                <p className="text-xs text-[#3A5A40] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROFIL DOKTER */}
      <section id="dokter" className="max-w-7xl mx-auto w-full py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1B4332] text-[#FAF7F0] rounded-[32px] p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xl">
          <div className="lg:col-span-4 flex flex-col items-center text-center bg-[#0E261C] rounded-3xl p-6 border border-[#2D6A4F]">
            <div className="w-24 h-24 rounded-3xl bg-[#2D6A4F] border-2 border-[#FAF7F0]/30 flex items-center justify-center text-[#FAF7F0] mb-4">
              <AppIcon name="user-doctor" className="w-12 h-12" />
            </div>
            <h3 className="text-base font-extrabold">drg. Yuli Kartilla Panjaitan</h3>
            <p className="text-xs text-[#95D5B2] font-semibold mt-0.5">Dokter Gigi Umum &amp; Penanggung Jawab</p>
            <span className="mt-3 px-3 py-1 rounded-full bg-[#FAF7F0]/10 font-mono text-[10px] text-[#FAF7F0]">
              SIP.503/449/DRG/2026
            </span>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF8A93]">Profil Dokter Kami</span>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              Pendekatan Klinis Lembut, Edukatif, dan Berorientasi Kenyamanan Pasien
            </h2>
            <p className="text-xs sm:text-sm text-[#D8E8DF] leading-relaxed">
              Berpengalaman menangani perawatan konservasi estetik, perawatan saluran akar (endodontik),
              perawatan periodontal, bedah mulut minor (odontektomi gigi bungsu), hingga perawatan ortodonti
              untuk anak maupun dewasa dengan komunikasi yang hangat dan menyeluruh.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-bold">
              {['Konservasi & Estetika', 'Endodontik (PSA)', 'Periodonsia', 'Bedah Mulut Minor', 'Ortodonti', 'Pedodonsia'].map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-xl bg-[#2D6A4F] text-[#FAF7F0]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PELAYANAN GIGI */}
      <section id="layanan" className="max-w-7xl mx-auto w-full py-12 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E63946]">Pelayanan Gigi</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1B4332]">Layanan Lengkap untuk Seluruh Keluarga</h2>
          </div>
          <a href="#booking" className="text-xs font-bold text-[#E63946] hover:underline inline-flex items-center gap-1.5">
            <span>Konsultasikan keluhan Anda</span>
            <AppIcon name="arrow-right" className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICE_CARDS.map((srv) => (
            <div key={srv.title} className="bg-[#FAF7F0] border border-[#E8E1D3] rounded-3xl p-6 space-y-3 hover-lift flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center">
                    <AppIcon name={srv.icon} className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#1B4332] text-[#FAF7F0] font-mono text-[10px] font-bold">
                    {srv.price}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-[#1B4332]">{srv.title}</h3>
                <p className="text-xs text-[#3A5A40] leading-relaxed">{srv.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONI PASIEN (APLIKASI & GOOGLE REVIEW) */}
      <section id="testimoni" className="bg-[#FAF7F0] border-y border-[#E8E1D3] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E63946]">Ulasan Terverifikasi</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1B4332]">Testimoni Pasien Yovela Dental</h2>
              <p className="text-xs text-[#52796F]">
                Rata-rata <strong>{avgRating}/5.0</strong> dari ulasan langsung aplikasi klinik &amp; Google Reviews
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] text-xs font-bold cursor-pointer transition"
              >
                {showReviewForm ? 'Tutup Form Ulasan' : 'Tulis Testimoni di Aplikasi'}
              </button>
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl border border-[#1B4332]/25 bg-white hover:bg-[#F5F1E8] text-[#1B4332] text-xs font-bold inline-flex items-center gap-1.5 transition"
              >
                <span>Google Reviews</span>
                <AppIcon name="arrow-up-right-from-square" className="w-3 h-3" />
              </a>
            </div>
          </div>

          {revSuccess && (
            <div className="p-3.5 rounded-2xl bg-[#1B4332] text-[#FAF7F0] text-xs font-bold">
              {revSuccess}
            </div>
          )}

          {showReviewForm && (
            <form onSubmit={handleTestimonialSubmit} className="bg-[#F5F1E8] border border-[#DED6C5] rounded-3xl p-6 space-y-4 text-xs">
              <h3 className="font-extrabold text-sm text-[#1B4332]">Bagikan Pengalaman Perawatan Anda</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nama Anda..."
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  className="p-2.5 rounded-xl border border-[#DED6C5] bg-white text-[#1B4332] font-semibold outline-none focus:border-[#1B4332]"
                />
                <input
                  type="text"
                  required
                  placeholder="Layanan yang diterima..."
                  value={revService}
                  onChange={(e) => setRevService(e.target.value)}
                  className="p-2.5 rounded-xl border border-[#DED6C5] bg-white text-[#1B4332] outline-none focus:border-[#1B4332]"
                />
                <CustomSelect
                  value={revRating}
                  onChange={setRevRating}
                  options={[
                    { value: '5', label: '5 Bintang — Sangat Memuaskan' },
                    { value: '4', label: '4 Bintang — Memuaskan' },
                    { value: '3', label: '3 Bintang — Cukup Baik' },
                  ]}
                />
              </div>
              <textarea
                rows={3}
                required
                placeholder="Ceritakan pengalaman Anda berkunjung ke Yovela Dental Clinic..."
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#DED6C5] bg-white text-[#1B4332] outline-none focus:border-[#1B4332]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold cursor-pointer transition"
              >
                Terbitkan Testimoni
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-[#F5F1E8] border border-[#E8E1D3] rounded-3xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-[#E63946]">
                      {'★'.repeat(t.rating)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      t.source === 'GOOGLE_REVIEW'
                        ? 'bg-[#1B4332] text-[#FAF7F0]'
                        : 'bg-white border border-[#DED6C5] text-[#2D6A4F]'
                    }`}>
                      {t.source === 'GOOGLE_REVIEW' ? 'Google Review' : 'Pasien Aplikasi'}
                    </span>
                  </div>
                  <p className="text-xs text-[#2D4739] leading-relaxed">&ldquo;{t.comment}&rdquo;</p>
                </div>
                <div className="pt-3 border-t border-[#E8E1D3]">
                  <p className="text-xs font-extrabold text-[#1B4332]">{t.patientName}</p>
                  <p className="text-[10px] text-[#52796F]">{t.serviceName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE BOOKING ONLINE TERHUBUNG KE APLIKASI YOVELA */}
      <section id="booking" className="max-w-7xl mx-auto w-full py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E63946]">Booking Online Real-Time</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1B4332] leading-tight">
              Jadwalkan Kunjungan Anda Tanpa Perlu Antre Lama
            </h2>
            <p className="text-xs sm:text-sm text-[#3A5A40] leading-relaxed">
              Formulir booking ini terhubung langsung ke sistem jadwal dokter di aplikasi{' '}
              <strong>Yovela Dental Clinic</strong>. Begitu Anda mengirim formulir, slot langsung terkunci
              untuk Anda dan petugas kami siap melakukan konfirmasi melalui WhatsApp.
            </p>
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E8E1D3] space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#1B4332]">
                <AppIcon name="circle-check" className="text-[#2D6A4F]" />
                <span>Deteksi bentrok jam dokter otomatis</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-[#1B4332]">
                <AppIcon name="circle-check" className="text-[#2D6A4F]" />
                <span>Nomor Rekam Medis diterbitkan otomatis untuk pasien baru</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-[#1B4332]">
                <AppIcon name="circle-check" className="text-[#2D6A4F]" />
                <span>Pengingat jadwal H-1 via WhatsApp</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form onSubmit={handleBookingSubmit} className="bg-[#FAF7F0] border border-[#DED6C5] rounded-[28px] p-6 sm:p-8 shadow-md space-y-4 text-xs">
              {bookingError && (
                <div className="p-3 rounded-xl bg-[#E63946]/10 border border-[#E63946]/40 text-[#D62828] font-bold">
                  {bookingError}
                </div>
              )}

              {bookingResult && (
                <div className="p-4 rounded-2xl bg-[#1B4332] text-[#FAF7F0] space-y-1">
                  <p className="font-extrabold text-sm flex items-center gap-2">
                    <AppIcon name="circle-check" className="w-4 h-4 text-[#95D5B2]" />
                    Booking Berhasil Terdaftar di Sistem Klinik!
                  </p>
                  <p className="text-[11px] text-[#D8E8DF]">
                    Pasien: <strong>{bookingResult.patientName}</strong> ({bookingResult.rmNumber}) • Jadwal:{' '}
                    <strong className="font-mono">{bookingResult.scheduledDate} {bookingResult.scheduledTime} WIB</strong> bersama{' '}
                    <strong>{bookingResult.doctorName}</strong>.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1B4332] mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rina Anggraini"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED6C5] bg-white text-[#1B4332] font-semibold focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1B4332] mb-1">Nomor WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="0812-3456-7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED6C5] bg-white text-[#1B4332] font-mono font-semibold focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1B4332] mb-1">Tanggal Kunjungan *</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED6C5] bg-white text-[#1B4332] font-semibold focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1B4332] mb-1">Pilih Slot Jam *</label>
                  <CustomSelect
                    value={scheduledTime}
                    onChange={setScheduledTime}
                    options={TIME_SLOTS.map((slot) => ({ value: slot, label: `${slot} WIB` }))}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Layanan / Keluhan Utama *</label>
                <CustomSelect
                  value={serviceName}
                  onChange={setServiceName}
                  options={[
                    { value: 'Konsultasi & Pemeriksaan Gigi', label: 'Konsultasi & Pemeriksaan Gigi' },
                    { value: 'Scaling & Polishing Karang Gigi', label: 'Scaling & Polishing Karang Gigi' },
                    { value: 'Tambal Gigi Komposit Estetik', label: 'Tambal Gigi Komposit Estetik' },
                    { value: 'Perawatan Saluran Akar (PSA)', label: 'Perawatan Saluran Akar (PSA)' },
                    { value: 'Pencabutan / Operasi Gigi Bungsu', label: 'Pencabutan / Operasi Gigi Bungsu' },
                    { value: 'Pemasangan / Kontrol Behel Ortodonti', label: 'Pemasangan / Kontrol Behel Ortodonti' },
                    { value: 'Bleaching / Veneer Estetik', label: 'Bleaching / Veneer Estetik' },
                  ]}
                />
              </div>

              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Ceritakan singkat keluhan atau alergi obat bila ada..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#DED6C5] bg-white text-[#1B4332] focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <button
                type="submit"
                disabled={isBooking}
                className="w-full py-3.5 rounded-2xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold text-xs shadow-lg shadow-[#E63946]/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <AppIcon name="calendar-check" className="w-4 h-4" />
                <span>{isBooking ? 'Menyimpan Jadwal...' : 'Konfirmasi Booking Jadwal'}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER PROFESIONAL ALA ELECTRONJS (Multi-Column Architectural Dark Forest Footer) */}
      <footer className="bg-[#0E261C] text-[#D8E8DF] border-t border-[#2D6A4F]/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
            {/* Kolom Brand */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B4332] border border-[#40916C]/50 flex items-center justify-center">
                  <svg viewBox="0 0 512 512" className="w-5 h-5 fill-[#FAF7F0]">
                    <path d="M416 112c-35.3 0-64 28.7-64 64v51.2c0 23.4-12.2 44.9-32.3 56.8L272 312.6l-47.7-28.6c-20.1-12-32.3-33.5-32.3-56.8V176c0-35.3-28.7-64-64-64S64 140.7 64 176c0 86.8 52.3 162.7 128 193.3V432c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V369.3c75.7-30.6 128-106.5 128-193.3c0-35.3-28.7-64-64-64z" />
                  </svg>
                </div>
                <div>
                  <span className="font-extrabold text-base text-[#FAF7F0] block leading-none">Yovela Dental Clinic</span>
                  <span className="text-[11px] text-[#95D5B2]">SIM-RME &amp; Modern Dental Care</span>
                </div>
              </div>
              <p className="text-xs text-[#A3C9B5] leading-relaxed">
                Klinik gigi modern dengan rekam medis elektronik terintegrasi, odontogram digital FDI,
                dan pelayanan ramah keluarga di Semarang.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1B4332] border border-[#2D6A4F] text-[11px] font-mono text-[#FAF7F0]">
                <span className="w-2 h-2 rounded-full bg-[#95D5B2]" />
                <span>SIP.503/449/DRG/2026</span>
              </div>
            </div>

            {/* Kolom 1: Layanan */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#FAF7F0]">Layanan</h4>
              <ul className="space-y-2 text-xs text-[#A3C9B5]">
                <li><a href="#layanan" className="hover:text-white transition">Pemeriksaan &amp; Odontogram</a></li>
                <li><a href="#layanan" className="hover:text-white transition">Scaling &amp; Periodonsia</a></li>
                <li><a href="#layanan" className="hover:text-white transition">Konservasi &amp; PSA</a></li>
                <li><a href="#layanan" className="hover:text-white transition">Ortodonti &amp; Estetika</a></li>
                <li><a href="#layanan" className="hover:text-white transition">Bedah Mulut Minor</a></li>
              </ul>
            </div>

            {/* Kolom 2: Klinik */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#FAF7F0]">Klinik</h4>
              <ul className="space-y-2 text-xs text-[#A3C9B5]">
                <li><a href="#profil" className="hover:text-white transition">Tentang Kami</a></li>
                <li><a href="#dokter" className="hover:text-white transition">Profil Dokter</a></li>
                <li><a href="#testimoni" className="hover:text-white transition">Testimoni Pasien</a></li>
                <li><a href="#booking" className="hover:text-white transition">Booking Online</a></li>
              </ul>
            </div>

            {/* Kolom 3: Pasien & Lokasi */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#FAF7F0]">Pasien &amp; Lokasi</h4>
              <ul className="space-y-2 text-xs text-[#A3C9B5]">
                <li><a href="#booking" className="hover:text-white transition">Jadwalkan Kunjungan</a></li>
                <li><a href="#testimoni" className="hover:text-white transition">Tulis Testimoni</a></li>
                <li><a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Google Maps Review</a></li>
                <li><a href="#profil" className="hover:text-white transition">Standar Sterilisasi</a></li>
              </ul>
            </div>

            {/* Kolom 4: Kontak */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#FAF7F0]">Kontak</h4>
              <ul className="space-y-2 text-xs text-[#A3C9B5]">
                <li>Jl. Pemuda No. 45, Semarang</li>
                <li className="font-mono">(024) 8765-4321</li>
                <li>Senin–Jumat: 09.00–20.00</li>
                <li>Sabtu: 09.00–17.00</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar ala ElectronJS */}
        <div className="border-t border-[#1B4332] bg-[#0A1C15]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#8FB8A3]">
            <p>© {new Date().getFullYear()} Yovela Dental Clinic. Seluruh hak cipta dilindungi.</p>
            <div className="flex items-center gap-4">
              <span>Standar RME Permenkes RI</span>
              <span>•</span>
              <span>FHIR R4 SATUSEHAT Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
