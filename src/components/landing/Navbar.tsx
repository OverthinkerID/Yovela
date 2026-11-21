'use client';

import React, { useEffect, useState } from 'react';
import { Menu, ArrowUpRight } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landingConfig';
import { MobileMenu } from './MobileMenu';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 36);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'py-3 px-4 sm:px-6' : 'py-5 px-4 sm:px-8'
        }`}
      >
        <div
          className={`max-w-7xl mx-auto rounded-full transition-all duration-300 flex items-center justify-between gap-4 px-5 sm:px-7 ${
            scrolled
              ? 'py-2.5 bg-[#FAF6EE]/90 backdrop-blur-xl border border-[#DFD4C0] shadow-lg shadow-[#234B38]/8'
              : 'py-3 bg-[#F3EBDD]/65 backdrop-blur-md border border-[#DFD4C0]/60'
          }`}
        >
          <a href="#home" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#234B38] text-[#F3EBDD] flex items-center justify-center">
              <svg viewBox="0 0 512 512" className="w-4 h-4 fill-[#F3EBDD]">
                <path d="M416 112c-35.3 0-64 28.7-64 64v51.2c0 23.4-12.2 44.9-32.3 56.8L272 312.6l-47.7-28.6c-20.1-12-32.3-33.5-32.3-56.8V176c0-35.3-28.7-64-64-64S64 140.7 64 176c0 86.8 52.3 162.7 128 193.3V432c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V369.3c75.7-30.6 128-106.5 128-193.3c0-35.3-28.7-64-64-64z" />
              </svg>
            </div>
            <div className="leading-none">
              <span className="font-editorial text-base sm:text-lg font-semibold text-[#234B38] block">
                {LANDING_CONFIG.brand.name}
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-wide text-[#234B38]">
            {LANDING_CONFIG.navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative py-1 hover:text-[#E65B45] transition-colors after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E65B45] hover:after:w-full after:transition-all after:duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href="#appointment"
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#234B38] hover:bg-[#E65B45] text-[#F3EBDD] text-xs font-bold transition-colors duration-200 shadow-sm"
            >
              <span>Book Appointment</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka Menu"
              className="lg:hidden w-10 h-10 rounded-full border border-[#234B38]/20 bg-[#FAF6EE] text-[#234B38] flex items-center justify-center cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};
