'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Stethoscope, Activity } from 'lucide-react';

interface AuthBrandPanelProps {
  backHref?: string;
  backLabel?: string;
  badgeLabel?: string;
  subtitle?: string;
  footerRightLabel?: string;
}

export function AuthBrandPanel({
  backHref = '/landingpage',
  backLabel = 'Beranda Klinik',
  badgeLabel = 'SIM-RME v3.3',
  subtitle = 'Portal internal tenaga medis dan manajemen klinik untuk pengelolaan rekam medis gigi, odontogram FDI, antrean poli, serta kasir terintegrasi.',
  footerRightLabel = 'Akses Staf Terverifikasi',
}: AuthBrandPanelProps) {
  return (
    <aside className="lg:w-[44%] xl:w-[42%] bg-[#1B4332] text-[#FAF7F0] p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
      {/* Dekorasi pencahayaan */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#2D6A4F]/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#E63946]/20 blur-3xl" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0E261C]/75 hover:bg-[#0E261C] border border-[#2D6A4F] text-xs font-semibold text-[#FAF7F0] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel}</span>
        </Link>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E261C]/80 border border-[#2D6A4F] text-[10px] font-mono font-bold uppercase tracking-wider text-[#B7D3C4]">
          <span className="w-2 h-2 rounded-full bg-[#95D5B2] animate-pulse" />
          {badgeLabel}
        </span>
      </div>

      {/* Konten Utama */}
      <div className="relative z-10 my-8 lg:my-0 space-y-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F0]/12 border border-[#FAF7F0]/25 flex items-center justify-center p-2.5 shrink-0 shadow-lg">
            <svg viewBox="0 0 512 512" className="w-full h-full fill-[#FAF7F0]" aria-hidden="true">
              <path d="M416 112c-35.3 0-64 28.7-64 64v51.2c0 23.4-12.2 44.9-32.3 56.8L272 312.6l-47.7-28.6c-20.1-12-32.3-33.5-32.3-56.8V176c0-35.3-28.7-64-64-64S64 140.7 64 176c0 86.8 52.3 162.7 128 193.3V432c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V369.3c75.7-30.6 128-106.5 128-193.3c0-35.3-28.7-64-64-64z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#FAF7F0]">
              Yovela Dental Clinic
            </h1>
            <p className="text-xs text-[#B7D3C4] font-medium">
              Dikembangkan oleh Overthinker Studio
            </p>
          </div>
        </div>

        {/* Ilustrasi Vektor Klinik Hidup & Profesional */}
        <div className="rounded-3xl bg-[#0E261C]/75 border border-[#2D6A4F]/80 p-3.5 sm:p-4 shadow-2xl relative overflow-hidden">
          <svg
            viewBox="0 0 440 245"
            className="w-full h-auto max-h-56 mx-auto select-none"
            role="img"
            aria-label="Ilustrasi suite perawatan dan rekam medis Yovela Dental Clinic"
          >
            <defs>
              <linearGradient id="authOatCanvas" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FAF7F0" />
                <stop offset="100%" stopColor="#EFE6D5" />
              </linearGradient>
              <linearGradient id="authForestArch" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1F4D37" />
                <stop offset="100%" stopColor="#122E21" />
              </linearGradient>
              <radialGradient id="authLampGlow" cx="50%" cy="30%" r="55%">
                <stop offset="0%" stopColor="#FAF7F0" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#FAF7F0" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Latar kanvas Oat Milk */}
            <rect x="6" y="6" width="428" height="233" rx="22" fill="url(#authOatCanvas)" />

            {/* Aksen lingkaran lembut */}
            <circle cx="372" cy="54" r="46" fill="#E63946" opacity="0.12" />
            <circle cx="66" cy="194" r="48" fill="#1B4332" opacity="0.09" />

            {/* Lengkung Sanctuary Klinik */}
            <path
              d="M126 220V106C126 54.08 168.08 12 220 12C271.92 12 314 54.08 314 106V220H126Z"
              fill="url(#authForestArch)"
            />
            <path
              d="M140 220V108C140 63.82 175.82 28 220 28C264.18 28 300 63.82 300 108V220"
              fill="none"
              stroke="#FAF7F0"
              strokeOpacity="0.2"
              strokeWidth="1.5"
            />

            {/* Sorotan lampu periksa halus */}
            <ellipse cx="220" cy="96" rx="70" ry="52" fill="url(#authLampGlow)" />

            {/* Lengan lampu periksa modern */}
            <path d="M220 28V44" stroke="#95D5B2" strokeWidth="3" strokeLinecap="round" />
            <rect x="192" y="42" width="56" height="14" rx="7" fill="#FAF7F0" />
            <circle cx="220" cy="49" r="4.5" fill="#E63946" />

            {/* Ikon gigi bersih di tengah atas lengkungan */}
            <path
              d="M207 78c-5 0-9 4-9 9.5 0 7 3.8 13.5 6.8 18.2 1.6 2.5 4.2 2.2 5.4-.3 1.4-2.8 3.2-6.5 5.2-6.5s3.8 3.7 5.2 6.5c1.2 2.5 3.8 2.8 5.4.3 3-4.7 6.8-11.2 6.8-18.2 0-5.5-4-9.5-9-9.5-3 0-5.2 1.4-7.4 2.7-2.2-1.3-4.4-2.7-7.4-2.7Z"
              fill="#95D5B2"
              opacity="0.9"
            />

            {/* Kursi Dental Ergonomis */}
            <rect x="176" y="120" width="88" height="44" rx="20" fill="#FAF7F0" />
            <rect x="164" y="154" width="112" height="14" rx="7" fill="#EAE1CF" />
            <rect x="174" y="168" width="92" height="28" rx="11" fill="#D9CEBA" />
            <rect x="158" y="204" width="124" height="7" rx="3.5" fill="#0B1F16" opacity="0.55" />

            {/* Kartu Mengambang Kiri Atas — Mini Odontogram FDI */}
            <g className="animate-float-slow">
              <rect
                x="20"
                y="34"
                width="132"
                height="62"
                rx="14"
                fill="#FFFFFF"
                stroke="#DED6C5"
                strokeWidth="1.5"
              />
              <circle cx="38" cy="52" r="7" fill="#1B4332" />
              <path
                d="M35 52.5L37.2 54.7L41.2 50.2"
                fill="none"
                stroke="#FAF7F0"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="51" y="55" fontSize="9" fontWeight="700" fill="#1B4332" fontFamily="sans-serif">
                Odontogram FDI
              </text>
              {/* Deret 6 kotak gigi mini */}
              <rect x="30" y="67" width="14" height="14" rx="3" fill="#E6F2EC" stroke="#2D6A4F" strokeWidth="1" />
              <rect x="48" y="67" width="14" height="14" rx="3" fill="#E6F2EC" stroke="#2D6A4F" strokeWidth="1" />
              <rect x="66" y="67" width="14" height="14" rx="3" fill="#FDE8EA" stroke="#E63946" strokeWidth="1.2" />
              <rect x="84" y="67" width="14" height="14" rx="3" fill="#E6F2EC" stroke="#2D6A4F" strokeWidth="1" />
              <rect x="102" y="67" width="14" height="14" rx="3" fill="#E6F2EC" stroke="#2D6A4F" strokeWidth="1" />
              <rect x="120" y="67" width="14" height="14" rx="3" fill="#E6F2EC" stroke="#2D6A4F" strokeWidth="1" />
            </g>

            {/* Kartu Mengambang Kanan Bawah — Live Antrean & Kasir */}
            <g className="animate-float-slow" style={{ animationDelay: '1.6s' }}>
              <rect
                x="286"
                y="148"
                width="134"
                height="62"
                rx="14"
                fill="#FFFFFF"
                stroke="#DED6C5"
                strokeWidth="1.5"
              />
              <circle cx="305" cy="168" r="7" fill="#E63946" opacity="0.16" />
              <circle cx="305" cy="168" r="3.5" fill="#E63946" />
              <text x="318" y="171" fontSize="9" fontWeight="700" fill="#1B4332" fontFamily="sans-serif">
                Poli &amp; Kasir Live
              </text>
              <rect x="298" y="182" width="108" height="6" rx="3" fill="#1B4332" opacity="0.14" />
              <rect x="298" y="182" width="74" height="6" rx="3" fill="#2D6A4F" />
              <rect x="298" y="194" width="52" height="5" rx="2.5" fill="#4A6B5B" opacity="0.45" />
            </g>
          </svg>
        </div>

        <p className="text-xs sm:text-sm text-[#D8E8DF] leading-relaxed">
          {subtitle}
        </p>

        {/* Chip Keunggulan Ringkas */}
        <div className="hidden sm:flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0E261C]/65 border border-[#2D6A4F]/70 text-[11px] font-semibold text-[#FAF7F0]">
            <Stethoscope className="w-3.5 h-3.5 text-[#95D5B2]" />
            Odontogram FDI
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0E261C]/65 border border-[#2D6A4F]/70 text-[11px] font-semibold text-[#FAF7F0]">
            <Activity className="w-3.5 h-3.5 text-[#95D5B2]" />
            Poli &amp; Kasir Live
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0E261C]/65 border border-[#2D6A4F]/70 text-[11px] font-semibold text-[#FAF7F0]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#95D5B2]" />
            RBAC Terenkripsi
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 hidden lg:flex items-center justify-between text-[11px] text-[#95D5B2]/80 border-t border-[#2D6A4F]/50 pt-4">
        <span>© {new Date().getFullYear()} Yovela Dental Clinic</span>
        <span className="font-mono">{footerRightLabel}</span>
      </div>
    </aside>
  );
}
