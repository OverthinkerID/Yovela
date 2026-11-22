'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { AuthBrandPanel } from '@/components/AuthBrandPanel';

export default function ForgotPasswordPage() {
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devResetPath, setDevResetPath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setDevResetPath('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Masukkan alamat email staf yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || 'Gagal memproses permintaan reset kata sandi.';
        setErrorMsg(msg);
        showToast(msg, 'error');
        return;
      }

      const okMsg =
        data?.message ||
        'Jika email terdaftar dan aktif, instruksi reset kata sandi telah disiapkan.';
      setSuccessMsg(okMsg);
      if (typeof data?.devResetPath === 'string' && data.devResetPath.startsWith('/')) {
        setDevResetPath(data.devResetPath);
      }
      showToast('Permintaan reset kata sandi diproses.', 'success');
    } catch {
      const msg = 'Gagal terhubung ke server. Periksa koneksi Anda dan coba lagi.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#1B4332] flex flex-col lg:flex-row">
      {/* Kolom Kiri — Brand & Ilustrasi SVG Hidup */}
      <AuthBrandPanel
        backHref="/login"
        backLabel="Kembali ke Login"
        badgeLabel="Pemulihan Akun"
        subtitle="Sistem pemulihan kata sandi menggunakan token sekali pakai terenkripsi (berlaku 30 menit, SHA-256) untuk menjaga integritas akses rekam medis klinik."
        footerRightLabel="Single-Use Reset Token"
      />

      {/* Kolom Kanan — Form Lupa Kata Sandi */}
      <main className="flex-1 flex flex-col justify-center items-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-md bg-[#FAF7F0] border border-[#DED6C5] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#1B4332]/8">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B4332]/8 text-[#1B4332] text-[11px] font-bold mb-3">
              <KeyRound className="w-3.5 h-3.5 text-[#2D6A4F]" />
              Reset Kata Sandi Staf
            </span>
            <h2 className="text-2xl font-extrabold text-[#1B4332] tracking-tight">
              Lupa Kata Sandi?
            </h2>
            <p className="text-xs sm:text-sm text-[#4A6B5B] mt-1">
              Masukkan email staf terdaftar Anda untuk menerima instruksi pengaturan ulang kata sandi.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-[#E63946]/10 border border-[#E63946]/30 text-[#9B1C26] text-xs font-semibold flex items-start gap-2.5"
            >
              <ShieldCheck className="w-4 h-4 text-[#E63946] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-5 p-4 rounded-2xl bg-[#40916C]/15 border border-[#40916C]/40 text-[#1B4332] text-xs space-y-2.5"
            >
              <div className="flex items-start gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
              {devResetPath && (
                <div className="pt-2 border-t border-[#40916C]/25 space-y-2">
                  <p className="text-[11px] text-[#2D6A4F] font-medium">
                    Mode Development Lokal — gunakan tautan berikut untuk langsung menguji reset:
                  </p>
                  <Link
                    href={devResetPath}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1B4332] text-[#FAF7F0] font-bold text-xs hover:bg-[#2D6A4F] transition"
                  >
                    <span>Buka Halaman Reset Kata Sandi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-xs font-bold text-[#1B4332] mb-1.5"
              >
                Email Staf Terdaftar
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#4A6B5B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@yoveladental.id"
                  className="w-full bg-white border border-[#DED6C5] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1B4332] placeholder:text-[#8A9D93] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/15 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] font-bold py-3 rounded-xl transition shadow-md shadow-[#1B4332]/15 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Memproses Permintaan...' : 'Kirim Instruksi Reset'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E8E1D3] text-center">
            <p className="text-xs text-[#4A6B5B]">
              Ingat kata sandi Anda?{' '}
              <Link
                href="/login"
                className="font-bold text-[#1B4332] hover:text-[#E63946] underline underline-offset-4 transition"
              >
                Kembali ke Halaman Login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
