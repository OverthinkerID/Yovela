'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { LANDING_CONFIG, TreatmentConfigItem } from '../config/landingConfig';
import { initLandingAnimations } from '../lib/landingAnimations';
import { ScrollProgress } from '../components/landing/ScrollProgress';
import { BackToTop } from '../components/landing/BackToTop';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { SectionHeading } from '../components/landing/SectionHeading';
import { EditorialPhoto } from '../components/landing/EditorialPhoto';
import { TreatmentCard } from '../components/landing/TreatmentCard';
import { DoctorProfile } from '../components/landing/DoctorProfile';
import { GalleryGrid } from '../components/landing/GalleryGrid';
import { TestimonialCard } from '../components/landing/TestimonialCard';
import { AppointmentCTA } from '../components/landing/AppointmentCTA';
import { ContactSection } from '../components/landing/ContactSection';
import { Footer } from '../components/landing/Footer';

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentConfigItem | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    if (!pageRef.current) return;
    const cleanup = initLandingAnimations(pageRef.current);
    return cleanup;
  }, []);

  const { about, treatments, whyYovela, technologySteps, doctor, gallery, testimonials } = LANDING_CONFIG;

  const handlePrevTestimonial = () => {
    setTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    setTestimonialIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <div ref={pageRef} className="font-landing min-h-screen bg-[#F3EBDD] text-[#234B38] overflow-x-clip">
      <ScrollProgress />

      {/* 1. PREMIUM NAVIGATION BAR */}
      <Navbar />

      <main>
        {/* 2. HERO SECTION */}
        <HeroSection />

        {/* 3. ABOUT YOVELA (ASYMMETRIC EDITORIAL + OVERLAPPING VISUAL) */}
        <section id="about" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE] border-y border-[#DFD4C0]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Komposisi Foto Bertumpuk */}
            <div className="lg:col-span-6 relative">
              <div className="gsap-image-mask rounded-[32px] overflow-hidden border border-[#DFD4C0] shadow-xl">
                <EditorialPhoto
                  src={about.primaryImageSrc}
                  alt="Suasana Klinik Yovela Dental"
                  caption="Arsitektur tenang dengan pencahayaan hangat"
                  badge="Clinic Philosophy"
                  variant="suite"
                  className="h-[340px] sm:h-[430px] w-full gsap-parallax"
                />
              </div>

              <div className="hidden sm:block w-56 rounded-[24px] overflow-hidden border-4 border-[#FAF6EE] shadow-2xl absolute -bottom-8 -right-4 lg:-right-8">
                <EditorialPhoto
                  src={about.secondaryImageSrc}
                  alt="Detail Ruang Konsultasi"
                  badge="Precision"
                  variant="detail"
                  className="h-44 w-full"
                />
              </div>
            </div>

            {/* Narasi Filosofi */}
            <div className="lg:col-span-6 space-y-6">
              <SectionHeading
                eyebrow={about.eyebrow}
                title={about.headline}
                description={about.leadText}
              />

              <p className="gsap-fade-up text-sm text-[#4A6B5B] leading-relaxed">
                {about.bodyText}
              </p>

              <div className="gsap-stagger-group grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 items-stretch">
                {about.pillars.map((p) => (
                  <div
                    key={p.number}
                    className="gsap-stagger-card h-full flex flex-col p-5 rounded-3xl bg-[#F3EBDD] border border-[#DFD4C0] space-y-2"
                  >
                    <span className="font-mono text-xs font-bold text-[#E65B45]">{p.number}</span>
                    <h3 className="font-editorial text-xl font-semibold text-[#234B38]">{p.title}</h3>
                    <p className="text-xs text-[#4A6B5B] leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. DENTAL TREATMENTS */}
        <section id="treatments" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F3EBDD]">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <SectionHeading
                eyebrow="02 — Dental Treatments"
                title="Curated Treatments for Long-Term Oral Health."
                description="Setiap prosedur dirancang dengan pendekatan konservatif, penjelasan biaya transparan, dan kenyamanan pasien sebagai prioritas."
              />
              <a
                href="#appointment"
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#234B38]/30 bg-[#FAF6EE] hover:bg-[#234B38] hover:text-[#F3EBDD] text-[#234B38] text-xs font-bold transition-colors"
              >
                <span>Konsultasikan Keluhan</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            <div className="gsap-stagger-group grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {treatments.map((item, idx) => (
                <TreatmentCard
                  key={item.id}
                  item={item}
                  index={idx}
                  onExplore={(trt) => setSelectedTreatment(trt)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 5. WHY CHOOSE YOVELA (BENTO GRID DEEP FOREST GREEN) */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#234B38] text-[#F3EBDD]">
          <div className="max-w-7xl mx-auto space-y-12">
            <SectionHeading
              eyebrow={whyYovela.eyebrow}
              title={whyYovela.headline}
              theme="dark"
            />

            <div className="gsap-stagger-group grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {whyYovela.items.map((item, idx) => (
                <div
                  key={item.code}
                  className={`gsap-stagger-card rounded-[28px] p-7 border transition-transform duration-300 hover:-translate-y-1 flex flex-col justify-between space-y-6 ${
                    idx === 0
                      ? 'bg-[#E65B45] text-[#FAF6EE] border-[#E65B45]'
                      : 'bg-[#173326] text-[#F3EBDD] border-[#35634D]'
                  }`}
                >
                  <span
                    className={`font-mono text-xs font-bold ${
                      idx === 0 ? 'text-[#FAF6EE]/85' : 'text-[#E65B45]'
                    }`}
                  >
                    {item.code}
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-editorial text-2xl font-semibold leading-snug">{item.title}</h3>
                    <p
                      className={`text-xs leading-relaxed ${
                        idx === 0 ? 'text-[#FAF6EE]/90' : 'text-[#F3EBDD]/75'
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. DENTAL TECHNOLOGY & EXPERIENCE (STICKY STORYTELLING SECTION) */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE] border-b border-[#DFD4C0]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
              <SectionHeading
                eyebrow="04 — Technology & Experience"
                title="Precision Systems Behind a Calm Visit."
                description="Teknologi klinis hadir bukan untuk terasa rumit, melainkan agar diagnosis lebih akurat, catatan medis rapi, dan pasien memahami kondisinya secara visual."
              />
            </div>

            <div className="lg:col-span-7 gsap-stagger-group space-y-5">
              {technologySteps.map((st) => (
                <div
                  key={st.step}
                  className="gsap-stagger-card p-7 sm:p-8 rounded-[28px] bg-[#F3EBDD] border border-[#DFD4C0] flex flex-col sm:flex-row gap-5 items-start"
                >
                  <span className="w-12 h-12 rounded-2xl bg-[#234B38] text-[#F3EBDD] font-mono text-sm font-bold flex items-center justify-center shrink-0">
                    {st.step}
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-editorial text-2xl font-semibold text-[#234B38]">{st.title}</h3>
                    <p className="text-xs sm:text-sm text-[#4A6B5B] leading-relaxed">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. MEET OUR DENTIST */}
        <section id="dentist" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F3EBDD]">
          <div className="max-w-7xl mx-auto space-y-10">
            <SectionHeading
              eyebrow="05 — Meet Our Dentist"
              title="Guided by Clinical Rigor and Gentle Care."
            />
            <DoctorProfile doctor={doctor} />
          </div>
        </section>

        {/* 8. CLINIC GALLERY (HORIZONTAL SCROLLING EXPERIENCE) */}
        <section id="gallery" className="py-20 sm:py-28 bg-[#FAF6EE] border-y border-[#DFD4C0] space-y-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <SectionHeading
              eyebrow="06 — Clinic Experience"
              title="Inside the Yovela Space."
              description="Geser secara horizontal untuk menelusuri suasana ruang tunggu, suite perawatan, hingga ruang sterilisasi."
            />
          </div>
          <GalleryGrid items={gallery} />
        </section>

        {/* 9. PATIENT TESTIMONIALS (SLIDER + PLACEHOLDER BADGE) */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F3EBDD]">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <SectionHeading
                eyebrow="07 — Patient Stories"
                title="Words From Those We Care For."
                description="Contoh kartu testimoni (placeholder) — dapat diganti dengan ulasan pasien terverifikasi atau Google Reviews resmi klinik."
              />

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevTestimonial}
                  aria-label="Testimoni sebelumnya"
                  className="w-11 h-11 rounded-full border border-[#234B38]/25 bg-[#FAF6EE] hover:bg-[#234B38] hover:text-[#F3EBDD] text-[#234B38] flex items-center justify-center transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextTestimonial}
                  aria-label="Testimoni berikutnya"
                  className="w-11 h-11 rounded-full border border-[#234B38]/25 bg-[#FAF6EE] hover:bg-[#234B38] hover:text-[#F3EBDD] text-[#234B38] flex items-center justify-center transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile: Slider 1 kartu aktif, Desktop: 3 kartu */}
            <div className="md:hidden">
              <TestimonialCard item={testimonials[testimonialIndex]} />
            </div>

            <div className="hidden md:grid md:grid-cols-3 gap-6 gsap-stagger-group">
              {testimonials.map((t, idx) => (
                <div
                  key={t.id}
                  className={`gsap-stagger-card transition-all duration-300 ${
                    idx === testimonialIndex ? 'ring-2 ring-[#E65B45] rounded-[28px]' : ''
                  }`}
                >
                  <TestimonialCard item={t} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. APPOINTMENT CTA */}
        <AppointmentCTA />

        {/* 11. LOCATION & CONTACT */}
        <ContactSection />
      </main>

      {/* 12. PREMIUM FOOTER */}
      <Footer />

      <BackToTop />

      {/* MODAL DETAIL: EXPLORE TREATMENT */}
      {selectedTreatment && (
        <div
          className="fixed inset-0 z-50 bg-[#163224]/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedTreatment(null)}
        >
          <div
            className="bg-[#FAF6EE] text-[#234B38] border border-[#DFD4C0] rounded-[32px] max-w-lg w-full p-7 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#DFD4C0] pb-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#F3EBDD] border border-[#DFD4C0] text-[10px] font-bold uppercase tracking-wider text-[#E65B45]">
                  {selectedTreatment.category}
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl font-semibold mt-2 leading-tight">
                  {selectedTreatment.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTreatment(null)}
                aria-label="Tutup detail layanan"
                className="w-9 h-9 rounded-full bg-[#F3EBDD] text-[#234B38] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#4A6B5B] leading-relaxed">
              {selectedTreatment.description}
            </p>

            <div className="space-y-2 bg-[#F3EBDD] border border-[#DFD4C0] rounded-2xl p-4">
              {selectedTreatment.highlights.map((hl) => (
                <div key={hl} className="flex items-center gap-2 text-xs font-semibold text-[#234B38]">
                  <CheckCircle2 className="w-4 h-4 text-[#E65B45] shrink-0" />
                  <span>{hl}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div>
                <span className="block text-[10px] text-[#4A6B5B]">Estimasi Durasi &amp; Biaya</span>
                <strong className="text-sm font-extrabold text-[#234B38]">
                  {selectedTreatment.duration} • {selectedTreatment.priceLabel}
                </strong>
              </div>
              <a
                href="#appointment"
                onClick={() => setSelectedTreatment(null)}
                className="px-5 py-3 rounded-full bg-[#E65B45] hover:bg-[#CC4631] text-[#FAF6EE] text-xs font-bold transition"
              >
                Book Treatment
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
