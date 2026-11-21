'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppIcon } from '@/components/AppIcon';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials, registerAccount } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (activeTab === 'register') {
        if (password !== confirmPassword) {
          const msg = 'Konfirmasi kata sandi tidak cocok.';
          setErrorMsg(msg);
          showToast(msg, 'warning');
          return;
        }
        const reg = await registerAccount({
          name: fullName,
          username,
          pass: password,
          registrationToken,
        });
        if (!reg.success) {
          const msg = reg.message || 'Gagal mendaftarkan akun.';
          setErrorMsg(msg);
          showToast(msg, 'error');
          return;
        }
        const okMsg = `Akun ${username.trim()} berhasil dibuat sebagai ${reg.assignedRole || 'Staf Klinik'}! Silakan masuk via Sign In.`;
        setSuccessMsg(okMsg);
        showToast(okMsg, 'success');
        setFullName('');
        setPassword('');
        setConfirmPassword('');
        setRegistrationToken('');
        setActiveTab('signin');
        return;
      }

      const res = await loginWithCredentials(username, password);
      if (res && res.success) {
        showToast('Berhasil masuk ke Workspace Yovela Dental Clinic.', 'success');
        router.replace('/dashboard');
      } else {
        const msg = res?.message || 'Login gagal. Periksa kembali username dan kata sandi Anda.';
        setErrorMsg(msg);
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: 'signin' | 'register') => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
    setFullName('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setRegistrationToken('');
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex flex-col justify-between items-center p-4 relative overflow-hidden">
      {/* Dekorasi latar halus Forest Green & Oat */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#1B4332]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#E63946]/10 blur-3xl" />

      {/* Top Bar Portal yang Dipercantik */}
      <div className="w-full max-w-md pt-3 flex items-center justify-between gap-2 relative z-10">
        <Link
          href="/landingpage"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#FAF7F0]/90 hover:bg-white border border-[#DED6C5] shadow-xs text-[11px] font-bold text-[#1B4332] hover:text-[#E63946] transition"
        >
          <AppIcon name="arrow-left" className="w-3.5 h-3.5" />
          <span>Beranda Klinik</span>
        </Link>
        <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1B4332] border border-[#2D6A4F] shadow-sm text-[10px] font-mono font-bold text-[#FAF7F0] uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#95D5B2] animate-pulse" />
          <span>Portal Internal SIM-RME</span>
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center w-full py-6 relative z-10">
        <div className="w-full max-w-md bg-[#1B4332] border border-[#2D6A4F] rounded-3xl p-8 shadow-2xl shadow-[#1B4332]/25 text-[#FAF7F0]">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF7F0]/10 border border-[#FAF7F0]/20 flex items-center justify-center p-3 mb-3 shadow-lg">
              <svg viewBox="0 0 512 512" className="w-full h-full fill-[#FAF7F0]">
                <path d="M416 112c-35.3 0-64 28.7-64 64v51.2c0 23.4-12.2 44.9-32.3 56.8L272 312.6l-47.7-28.6c-20.1-12-32.3-33.5-32.3-56.8V176c0-35.3-28.7-64-64-64S64 140.7 64 176c0 86.8 52.3 162.7 128 193.3V432c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V369.3c75.7-30.6 128-106.5 128-193.3c0-35.3-28.7-64-64-64z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-[#FAF7F0] tracking-tight">Yovela Dental Clinic</h1>
            <p className="text-[11px] text-[#B7D3C4] mt-0.5">Sistem Informasi Rekam Medis &amp; Pembayaran</p>
          </div>

          {/* Switch Tab */}
          <div className="flex bg-[#0E261C] p-1 rounded-2xl border border-[#2D6A4F]/60 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTabChange('signin')}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer text-center ${
                activeTab === 'signin'
                  ? 'bg-[#FAF7F0] text-[#1B4332] font-extrabold shadow-sm'
                  : 'text-[#A3C9B5] hover:text-white'
              }`}
            >
              Sign In Staf
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer text-center ${
                activeTab === 'register'
                  ? 'bg-[#FAF7F0] text-[#1B4332] font-extrabold shadow-sm'
                  : 'text-[#A3C9B5] hover:text-white'
              }`}
            >
              Aktivasi Token
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-[#E63946]/20 border border-[#E63946]/50 text-[#FFD6D9] text-xs font-semibold flex items-center gap-2">
              <AppIcon name="circle-exclamation" className="text-[#FF8A93]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-[#40916C]/30 border border-[#74C69D]/50 text-[#E6F7EE] text-xs font-semibold flex items-center gap-2">
              <AppIcon name="circle-check" className="text-[#95D5B2]" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {activeTab === 'register' && (
              <>
                <div className="p-3 rounded-2xl bg-[#0E261C]/80 border border-[#2D6A4F] space-y-1.5">
                  <label className="block font-bold text-[#FAF7F0]">
                    Token Registrasi Staf <span className="text-[#FF8A93]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-[#95D5B2]">
                      <AppIcon name="shield-halved" />
                    </span>
                    <input
                      type="text"
                      required
                      value={registrationToken}
                      onChange={(e) => setRegistrationToken(e.target.value.toUpperCase())}
                      className="w-full bg-[#143326] border border-[#2D6A4F] rounded-xl pl-9 pr-3.5 py-2.5 text-[#FAF7F0] font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-[#FAF7F0] transition"
                      placeholder="YOVELA-XXX-XXXX"
                    />
                  </div>
                  <p className="text-[10px] text-[#A3C9B5] leading-relaxed">
                    Peran akun (<strong>Dokter</strong>, <strong>Perawat/Front Office</strong>, atau{' '}
                    <strong>Admin Pembayaran</strong>) ditetapkan otomatis dari token yang diberikan Dokter Penanggung Jawab.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-[#D8E8DF] mb-1.5">Nama Lengkap &amp; Gelar</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0E261C] border border-[#2D6A4F] rounded-xl px-3.5 py-2.5 text-[#FAF7F0] font-medium focus:outline-none focus:border-[#FAF7F0] transition"
                    placeholder="Contoh: drg. Andi Pratama"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block font-semibold text-[#D8E8DF] mb-1.5">Username Petugas / Dokter</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-[#74C69D]">
                  <AppIcon name="user" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0E261C] border border-[#2D6A4F] rounded-xl pl-9 pr-3.5 py-2.5 text-[#FAF7F0] font-medium focus:outline-none focus:border-[#FAF7F0] transition"
                  autoComplete="off"
                  placeholder="Masukkan username..."
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#D8E8DF] mb-1.5">Kata Sandi</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-[#74C69D]">
                  <AppIcon name="lock" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0E261C] border border-[#2D6A4F] rounded-xl pl-9 pr-3.5 py-2.5 text-[#FAF7F0] font-medium focus:outline-none focus:border-[#FAF7F0] transition"
                  autoComplete="off"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {activeTab === 'register' && (
              <div>
                <label className="block font-semibold text-[#D8E8DF] mb-1.5">Ulangi Kata Sandi</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-[#74C69D]">
                    <AppIcon name="lock" />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0E261C] border border-[#2D6A4F] rounded-xl pl-9 pr-3.5 py-2.5 text-[#FAF7F0] font-medium focus:outline-none focus:border-[#FAF7F0] transition"
                    autoComplete="off"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#E63946] hover:bg-[#D62828] text-white font-bold py-3 rounded-xl transition duration-150 shadow-lg shadow-[#E63946]/25 flex items-center justify-center gap-2 mt-3 cursor-pointer text-xs disabled:opacity-60"
            >
              <span>
                {isSubmitting
                  ? 'Memproses...'
                  : activeTab === 'register'
                  ? 'Aktifkan Akun dengan Token'
                  : 'Masuk ke Workspace Klinik'}
              </span>
              <AppIcon name="arrow-right" className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center text-[11px] text-[#52796F] font-medium py-3 relative z-10">
        © {new Date().getFullYear()} Yovela Dental Clinic. All Rights Reserved.
      </footer>
    </div>
  );
}
