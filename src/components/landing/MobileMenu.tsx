'use client';

import React from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landingConfig';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#163224]/95 backdrop-blur-xl text-[#F3EBDD] flex flex-col justify-between p-6 md:hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Navigasi Mobile"
    >
      <div className="flex items-center justify-between">
        <span className="font-editorial text-xl font-semibold tracking-tight">
          {LANDING_CONFIG.brand.name}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Menu"
          className="w-10 h-10 rounded-full border border-[#F3EBDD]/20 flex items-center justify-center text-[#F3EBDD] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-4 my-auto">
        {LANDING_CONFIG.navLinks.map((link, idx) => (
          <a
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="flex items-baseline justify-between py-2.5 border-b border-[#F3EBDD]/12 font-editorial text-3xl text-[#F3EBDD] hover:text-[#E65B45] transition"
          >
            <span>{link.label}</span>
            <span className="text-xs font-mono text-[#F3EBDD]/50">0{idx + 1}</span>
          </a>
        ))}
      </nav>

      <div className="space-y-4">
        <a
          href="#appointment"
          onClick={onClose}
          className="w-full py-4 rounded-full bg-[#E65B45] hover:bg-[#CC4631] text-[#FAF6EE] font-bold text-sm flex items-center justify-center gap-2 transition"
        >
          <span>Book Appointment</span>
          <ArrowUpRight className="w-4 h-4" />
        </a>
        <p className="text-center text-[11px] text-[#F3EBDD]/60">
          {LANDING_CONFIG.brand.tagline}
        </p>
      </div>
    </div>
  );
};
