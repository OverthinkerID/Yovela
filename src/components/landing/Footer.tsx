'use client';

import React from 'react';
import { LANDING_CONFIG } from '../../config/landingConfig';

export const Footer: React.FC = () => {
  const { brand, navLinks, contact } = LANDING_CONFIG;

  return (
    <footer className="gsap-footer bg-[#163224] text-[#F3EBDD] border-t border-[#234B38]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#234B38] border border-[#F3EBDD]/20 flex items-center justify-center">
                <svg viewBox="0 0 512 512" className="w-5 h-5 fill-[#F3EBDD]">
                  <path d="M416 112c-35.3 0-64 28.7-64 64v51.2c0 23.4-12.2 44.9-32.3 56.8L272 312.6l-47.7-28.6c-20.1-12-32.3-33.5-32.3-56.8V176c0-35.3-28.7-64-64-64S64 140.7 64 176c0 86.8 52.3 162.7 128 193.3V432c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V369.3c75.7-30.6 128-106.5 128-193.3c0-35.3-28.7-64-64-64z" />
                </svg>
              </div>
              <div>
                <span className="font-editorial text-lg font-semibold block leading-none">{brand.name}</span>
                <span className="text-[11px] text-[#F3EBDD]/70">{brand.tagline}</span>
              </div>
            </div>
            <p className="text-xs text-[#F3EBDD]/75 leading-relaxed max-w-xs">
              {brand.subTagline}
            </p>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E65B45]">Navigation</h4>
            <ul className="space-y-2 text-xs text-[#F3EBDD]/80">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-[#E65B45] transition">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E65B45]">Hours &amp; Contact</h4>
            <ul className="space-y-2 text-xs text-[#F3EBDD]/80">
              <li>{contact.addressPlaceholder}</li>
              <li className="font-mono">{contact.phonePlaceholder}</li>
              {contact.hours.map((h) => (
                <li key={h.day}>
                  {h.day}: <span className="font-mono">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E65B45]">Social Media</h4>
            <ul className="space-y-2 text-xs text-[#F3EBDD]/80">
              {contact.socials.map((soc) => (
                <li key={soc.label}>
                  <a
                    href={soc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#E65B45] transition"
                  >
                    {soc.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#234B38] bg-[#10241A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#F3EBDD]/65">
          <p>© {new Date().getFullYear()} {brand.name}. All Rights Reserved.</p>
          <p>Crafted by {brand.developerCredit}</p>
        </div>
      </div>
    </footer>
  );
};
