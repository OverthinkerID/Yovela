'use client';

import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landingConfig';
import { EditorialPhoto } from './EditorialPhoto';

export const HeroSection: React.FC = () => {
  const { hero } = LANDING_CONFIG;

  return (
    <section
      id="home"
      className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#F3EBDD]"
    >
      {/* Elemen Dekoratif Halus Melayang */}
      <div
        aria-hidden="true"
        className="gsap-float pointer-events-none absolute -top-20 right-[8%] w-72 h-72 rounded-full bg-[#E65B45]/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="gsap-float pointer-events-none absolute bottom-10 -left-16 w-80 h-80 rounded-full bg-[#234B38]/10 blur-3xl"
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
        {/* Kiri: Tipografi Editorial Besar & CTA */}
        <div className="lg:col-span-7 space-y-7">
          <div className="gsap-hero-item inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#FAF6EE] border border-[#DFD4C0] text-[#234B38] text-[11px] font-bold uppercase tracking-[0.16em]">
            <Sparkles className="w-3.5 h-3.5 text-[#E65B45]" />
            <span>{hero.eyebrow}</span>
          </div>

          <h1 className="gsap-hero-headline font-editorial text-4xl sm:text-6xl lg:text-[4.25rem] font-semibold text-[#234B38] leading-[1.06] tracking-tight">
            {hero.headline.split('Smile').map((part, idx, arr) =>
              idx < arr.length - 1 ? (
                <React.Fragment key={idx}>
                  {part}
                  <em className="italic font-normal text-[#E65B45]">Smile</em>
                </React.Fragment>
              ) : (
                <React.Fragment key={idx}>{part}</React.Fragment>
              )
            )}
          </h1>

          <p className="gsap-hero-item text-sm sm:text-lg text-[#4A6B5B] leading-relaxed max-w-xl">
            {hero.supportingText}
          </p>

          <div className="gsap-hero-item flex flex-wrap items-center gap-3.5 pt-1">
            <a
              href="#appointment"
              className="px-7 py-4 rounded-full bg-[#234B38] hover:bg-[#E65B45] text-[#F3EBDD] font-bold text-xs sm:text-sm inline-flex items-center gap-2.5 shadow-lg shadow-[#234B38]/20 transition-colors duration-200"
            >
              <span>{hero.primaryCta}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <a
              href="#about"
              className="px-7 py-4 rounded-full border border-[#234B38]/30 bg-[#FAF6EE]/80 hover:bg-[#FAF6EE] text-[#234B38] font-bold text-xs sm:text-sm transition-colors duration-200"
            >
              {hero.secondaryCta}
            </a>
          </div>

          {/* Statistik Teranimasi */}
          <div className="gsap-hero-item grid grid-cols-3 gap-6 pt-6 border-t border-[#DFD4C0] max-w-lg">
            {hero.stats.map((st) => (
              <div key={st.label}>
                <p className="font-editorial text-2xl sm:text-3xl font-bold text-[#234B38]">
                  <span className="gsap-counter" data-target={st.value}>
                    {st.value}
                  </span>
                  <span className="text-[#E65B45]">{st.suffix}</span>
                </p>
                <p className="text-[11px] font-semibold text-[#4A6B5B] mt-1">{st.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Kanan: Komposisi Foto Editorial Asimetris + Image Mask Reveal */}
        <div className="lg:col-span-5 relative">
          <div className="gsap-image-mask rounded-[36px] overflow-hidden shadow-2xl shadow-[#234B38]/20 border border-[#DFD4C0]">
            <EditorialPhoto
              src={hero.imageSrc}
              alt={hero.imageCaption}
              caption={hero.imageCaption}
              badge="Yovela Sanctuary"
              variant="clinic"
              priority
              className="h-[400px] sm:h-[500px] w-full gsap-parallax"
            />
          </div>

          {/* Kartu Melayang Ringkas */}
          <div className="gsap-float hidden sm:flex absolute -bottom-6 -left-6 bg-[#FAF6EE]/95 backdrop-blur-xl border border-[#DFD4C0] rounded-3xl p-4 shadow-xl items-center gap-3.5 max-w-[260px]">
            <div className="w-10 h-10 rounded-2xl bg-[#E65B45] text-[#FAF6EE] flex items-center justify-center font-editorial font-bold text-lg shrink-0">
              Y
            </div>
            <div>
              <p className="text-xs font-bold text-[#234B38]">Calm &amp; Unhurried</p>
              <p className="text-[10px] text-[#4A6B5B]">Scheduled 1-on-1 consultations with digital FDI mapping</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
