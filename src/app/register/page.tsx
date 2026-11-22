'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { AuthBrandPanel } from '@/components/AuthBrandPanel';

interface PasswordStrength {
  score: number;
  label: string;
  barColor: string;
  textColor: string;
}

function evaluatePasswordStrength(pw: string): PasswordStrength {
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

export default function RegisterPage() {
  const { registerAccount } = useAuth();
  const { showToast } = useToast();

  const [registrationToken, setRegistrationToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ message: string; role?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfo(null);

    if (!registrationToken.trim() || !fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Token registrasi, nama lengkap, email, dan kata sandi wajib diisi.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!acceptedPolicy) {
      setErrorMsg('Anda wajib menyetujui kebijakan kerahasiaan rekam medis klinik.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerAccount({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase() || undefined,
        pass: password,
        registrationToken: registrationToken.trim().toUpperCase(),
      });

      if (!res.success) {
        const msg = res.message || 'Gagal mendaftarkan akun staf.';
        setErrorMsg(msg);
        showToast(msg, 'error');
        return;
      }

      const assignedRole = res.assignedRole || 'Staf Klinik';
      const okMsg = `Akun ${email.trim().toLowerCase()} berhasil diaktifkan sebagai ${assignedRole}.`;
      setSuccessInfo({ message: okMsg, role: assignedRole });
      showToast(okMsg, 'success');

      setRegistrationToken('');
      setFullName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setAcceptedPolicy(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#1B4332] flex flex-col lg:flex-row">
      {/* Kolom Kiri — Brand & Ilustrasi SVG Hidup */}
      <AuthBrandPanel
        badgeLabel="Aktivasi Staf"
        subtitle="Pendaftaran akun staf baru dilindungi token otorisasi dari Penanggung Jawab Klinik untuk menjaga keamanan akses data rekam medis pasien."
        footerRightLabel="RBAC Token Provisioning"
      />

      {/* Kolom Kanan — Form Register */}
      <main className="flex-1 flex flex-col justify-center items-center p-5 sm:p-8 lg:p-10">
        <div className="w-full max-w-lg bg-[#FAF7F0] border border-[#DED6C5] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#1B4332]/8">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B4332]/8 text-[#1B4332] text-[11px] font-bold mb-3">
              <UserPlus className="w-3.5 h-3.5 text-[#2D6A4F]" />
              Registrasi Staf Klinik
            </span>
            <h2 className="text-2xl font-extrabold text-[#1B4332] tracking-tight">
              Buat Akun Staf Anda
            </h2>
            <p className="text-xs sm:text-sm text-[#4A6B5B] mt-1">
              Masukkan token registrasi resmi beserta data diri untuk mengaktifkan akses.
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

          {successInfo && (
            <div
              role="status"
              className="mb-5 p-4 rounded-2xl bg-[#40916C]/15 border border-[#40916C]/40 text-[#1B4332] text-xs space-y-2.5"
            >
              <div className="flex items-start gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                <span>{successInfo.message}</span>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1B4332] text-[#FAF7F0] font-bold text-xs hover:bg-[#2D6A4F] transition"
              >
                <span>Lanjut ke Halaman Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token Registrasi */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#DED6C5] space-y-1.5">
              <label
                htmlFor="reg-token"
                className="block text-xs font-bold text-[#1B4332]"
              >
                Token Registrasi Staf <span className="text-[#E63946]">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#2D6A4F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-token"
                  type="text"
                  required
                  value={registrationToken}
                  onChange={(e) => setRegistrationToken(e.target.value.toUpperCase())}
                  placeholder="YOVELA-XXX-XXXX"
                  className="w-full bg-[#FAF7F0] border border-[#DED6C5] rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono font-bold tracking-wider uppercase text-[#1B4332] placeholder:text-[#8A9D93] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/15 transition"
                />
              </div>
              <p className="text-[11px] text-[#4A6B5B]">
                Diperoleh dari Dokter Penanggung Jawab Klinik.
              </p>
            </div>

            {/* Nama Lengkap & Gelar */}
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-bold text-[#1B4332] mb-1.5"
              >
                Nama Lengkap &amp; Gelar <span className="text-[#E63946]">*</span>
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-[#4A6B5B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: drg. Andi Pratama"
                  className="w-full bg-white border border-[#DED6C5] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1B4332] placeholder:text-[#8A9D93] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/15 transition"
                />
              </div>
            </div>

            {/* Email & Username Opsional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-bold text-[#1B4332] mb-1.5"
                >
                  Email Resmi <span className="text-[#E63946]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#4A6B5B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-email"
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

              <div>
                <label
                  htmlFor="reg-username"
                  className="block text-xs font-bold text-[#1B4332] mb-1.5"
                >
                  Username <span className="text-[#6B7F73] font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-[#4A6B5B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Otomatis dari email"
                    className="w-full bg-white border border-[#DED6C5] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1B4332] placeholder:text-[#8A9D93] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/15 transition"
                  />
                </div>
              </div>
            </div>

            {/* Kata Sandi + Indikator Kekuatan */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-bold text-[#1B4332] mb-1.5"
              >
                Kata Sandi <span className="text-[#E63946]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#4A6B5B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Konfirmasi Kata Sandi */}
            <div>
              <label
                htmlFor="reg-confirm-password"
                className="block text-xs font-bold text-[#1B4332] mb-1.5"
              >
                Konfirmasi Kata Sandi <span className="text-[#E63946]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#4A6B5B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
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

            {/* Checkbox Kebijakan */}
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-[#DED6C5] accent-[#1B4332] cursor-pointer shrink-0"
              />
              <span className="text-xs text-[#4A6B5B] leading-relaxed">
                Saya menyetujui kebijakan kerahasiaan rekam medis pasien dan tata kelola akses
                internal Yovela Dental Clinic.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#E63946] hover:bg-[#D62828] text-white font-bold py-3 rounded-xl transition shadow-md shadow-[#E63946]/20 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              <span>{isSubmitting ? 'Mendaftarkan Akun...' : 'Aktifkan Akun Staf'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E8E1D3] text-center">
            <p className="text-xs text-[#4A6B5B]">
              Sudah memiliki akun staf aktif?{' '}
              <Link
                href="/login"
                className="font-bold text-[#1B4332] hover:text-[#E63946] underline underline-offset-4 transition"
              >
                Masuk ke Workspace
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
