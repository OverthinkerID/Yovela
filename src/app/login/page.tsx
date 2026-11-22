'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { AuthBrandPanel } from '@/components/AuthBrandPanel';

function getSafeNextPath(rawNext: string | null): string {
  if (!rawNext) return '/dashboard';
  if (rawNext.startsWith('/') && !rawNext.startsWith('//')) {
    return rawNext;
  }
  return '/dashboard';
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithCredentials } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setErrorMsg('Email atau username dan kata sandi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithCredentials(cleanIdentifier, password, rememberMe);
      if (res.success) {
        showToast('Berhasil masuk ke Workspace Yovela Dental Clinic.', 'success');
        const nextPath = getSafeNextPath(searchParams.get('next'));
        router.replace(nextPath);
      } else {
        const msg = res.message || 'Email atau kata sandi tidak valid.';
        setErrorMsg(msg);
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#1B4332] flex flex-col lg:flex-row">
      {/* Kolom Kiri — Brand & Ilustrasi SVG Hidup */}
      <AuthBrandPanel />

      {/* Kolom Kanan — Form Login */}
      <main className="flex-1 flex flex-col justify-center items-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-md bg-[#FAF7F0] border border-[#DED6C5] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#1B4332]/8">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B4332]/8 text-[#1B4332] text-[11px] font-bold mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
              Portal Autentikasi Staf
            </span>
            <h2 className="text-2xl font-extrabold text-[#1B4332] tracking-tight">
              Masuk ke Workspace
            </h2>
            <p className="text-xs sm:text-sm text-[#4A6B5B] mt-1">
              Masukkan email atau username staf dan kata sandi Anda.
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-bold text-[#1B4332] mb-1.5"
              >
                Email atau Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#4A6B5B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="nama@yoveladental.id atau username"
                  className="w-full bg-white border border-[#DED6C5] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1B4332] placeholder:text-[#8A9D93] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/15 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-[#1B4332]"
                >
                  Kata Sandi
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#2D6A4F] hover:text-[#E63946] transition"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#4A6B5B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
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
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#DED6C5] accent-[#1B4332] cursor-pointer"
                />
                <span className="text-xs font-medium text-[#4A6B5B]">
                  Ingat saya selama 14 hari
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] font-bold py-3 rounded-xl transition shadow-md shadow-[#1B4332]/15 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              <span>{isSubmitting ? 'Memverifikasi Sesi...' : 'Masuk ke Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E8E1D3] text-center space-y-2.5">
            <p className="text-xs text-[#4A6B5B]">
              Staf baru dan sudah memiliki token registrasi?
            </p>
            <Link
              href="/register"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#1B4332]/25 bg-white hover:bg-[#F5F1E8] text-xs font-bold text-[#1B4332] transition"
            >
              <span>Aktivasi Akun Staf Baru</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E63946]" />
            </Link>
          </div>
        </div>

        <p className="lg:hidden text-center text-[11px] text-[#52796F] font-medium mt-6">
          © {new Date().getFullYear()} Yovela Dental Clinic • Overthinker Studio
        </p>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center text-sm font-semibold text-[#1B4332]">
          Memuat halaman autentikasi...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
