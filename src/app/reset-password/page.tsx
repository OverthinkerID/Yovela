'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { AuthBrandPanel } from '@/components/AuthBrandPanel';

function evaluatePasswordStrength(pw: string): {
  score: number;
  label: string;
  barColor: string;
  textColor: string;
} {
  if (!pw) {
    return { score: 0, label: 'Belum diisi', barColor: 'bg-[#DED6C5]', textColor: 'text-[#6B7F73]' };
  }
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score += 1;

  if (score <= 1) {
    return { score: 1, label: 'Lemah (min. 8 karakter)', barColor: 'bg-[#E63946]', textColor: 'text-[#E63946]' };
  }
  if (score === 2) {
    return { score: 2, label: 'Cukup', barColor: 'bg-amber-500', textColor: 'text-amber-700' };
  }
  if (score === 3) {
    return { score: 3, label: 'Kuat', barColor: 'bg-[#40916C]', textColor: 'text-[#2D6A4F]' };
  }
  return { score: 4, label: 'Sangat Kuat', barColor: 'bg-[#1B4332]', textColor: 'text-[#1B4332]' };
}

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const token = (searchParams.get('token') || '').trim();
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = useMemo(() => evaluatePasswordStrength(newPassword), [newPassword]);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!token) {
      setErrorMsg('Tautan reset kata sandi tidak lengkap atau token tidak ditemukan.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Kata sandi baru minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || 'Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.';
        setErrorMsg(msg);
        showToast(msg, 'error');
        return;
      }

      const okMsg =
        data?.message || 'Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.';
      setSuccessMsg(okMsg);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Kata sandi berhasil diperbarui.', 'success');
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
        badgeLabel="Reset Sesi"
        subtitle="Tetapkan kata sandi baru minimal 8 karakter untuk mengamankan kembali akun staf Anda di SIM-RME Yovela Dental Clinic."
        footerRightLabel="Bcrypt Password Hashing"
      />

      {/* Kolom Kanan — Form Reset Password */}
      <main className="flex-1 flex flex-col justify-center items-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-md bg-[#FAF7F0] border border-[#DED6C5] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#1B4332]/8">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B4332]/8 text-[#1B4332] text-[11px] font-bold mb-3">
              <KeyRound className="w-3.5 h-3.5 text-[#2D6A4F]" />
              Pembaruan Kata Sandi
            </span>
            <h2 className="text-2xl font-extrabold text-[#1B4332] tracking-tight">
              Atur Kata Sandi Baru
            </h2>
            <p className="text-xs sm:text-sm text-[#4A6B5B] mt-1">
              Masukkan kata sandi baru untuk akun staf Anda.
            </p>
          </div>

          {!token && !successMsg && (
            <div
              role="alert"
              className="mb-5 p-4 rounded-2xl bg-[#E63946]/10 border border-[#E63946]/30 text-[#9B1C26] text-xs space-y-2"
            >
              <div className="flex items-start gap-2.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#E63946] shrink-0 mt-0.5" />
                <span>Tautan reset kata sandi tidak lengkap atau token tidak ditemukan.</span>
              </div>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-1.5 font-bold text-[#1B4332] hover:text-[#E63946] underline underline-offset-4"
              >
                <span>Minta tautan reset baru</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-[#E63946]/10 border border-[#E63946]/30 text-[#9B1C26] text-xs font-semibold flex items-start gap-2.5"
            >
              <ShieldCheck className="w-4 h-4 text-[#E63946] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg ? (
            <div
              role="status"
              className="p-4 rounded-2xl bg-[#40916C]/15 border border-[#40916C]/40 text-[#1B4332] text-xs space-y-3"
            >
              <div className="flex items-start gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4332] text-[#FAF7F0] font-bold text-xs hover:bg-[#2D6A4F] transition"
              >
                <span>Masuk dengan Kata Sandi Baru</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-password"
                  className="block text-xs font-bold text-[#1B4332] mb-1.5"
                >
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#4A6B5B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full bg-white border border-[#DED6C5] rounded-xl pl-10 pr-11 py-2.5 text-sm text-[#1B4332] placeholder:text-[#8A9D93] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/15 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#4A6B5B] hover:text-[#1B4332] hover:bg-[#F5F1E8] transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-colors ${
                          strength.score >= step ? strength.barColor : 'bg-[#E8E1D3]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] font-semibold ${strength.textColor}`}>
                    Kekuatan kata sandi: {strength.label}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reset-confirm-password"
                  className="block text-xs font-bold text-[#1B4332] mb-1.5"
                >
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#4A6B5B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full bg-white border border-[#DED6C5] rounded-xl pl-10 pr-11 py-2.5 text-sm text-[#1B4332] placeholder:text-[#8A9D93] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/15 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#4A6B5B] hover:text-[#1B4332] hover:bg-[#F5F1E8] transition cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p
                    className={`mt-1 text-[11px] font-semibold ${
                      passwordsMatch ? 'text-[#2D6A4F]' : 'text-[#E63946]'
                    }`}
                  >
                    {passwordsMatch ? 'Kata sandi cocok.' : 'Konfirmasi kata sandi belum cocok.'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] font-bold py-3 rounded-xl transition shadow-md shadow-[#1B4332]/15 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Menyimpan Kata Sandi...' : 'Simpan Kata Sandi Baru'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center text-sm font-semibold text-[#1B4332]">
          Memuat halaman reset kata sandi...
        </div>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}
