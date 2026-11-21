'use client';

import React from 'react';
import { MapPin, Clock, Phone, Mail } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landingConfig';
import { SectionHeading } from './SectionHeading';

export const ContactSection: React.FC = () => {
  const { contact } = LANDING_CONFIG;

  return (
    <section id="contact" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F3EBDD]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-6">
          <SectionHeading
            eyebrow="Location & Contact"
            title="Visit Our Clinic Sanctuary."
            description="Lengkapi alamat dan titik koordinat resmi klinik Anda pada konfigurasi terpusat sebelum publikasi."
          />
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          <div className="gsap-stagger-card h-full flex flex-col bg-[#FAF6EE] border border-[#DFD4C0] rounded-[28px] p-6 space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#234B38] text-[#F3EBDD] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-[#234B38]">Alamat Klinik</h3>
            <p className="text-xs text-[#4A6B5B] leading-relaxed">{contact.addressPlaceholder}</p>
          </div>

          <div className="gsap-stagger-card h-full flex flex-col bg-[#FAF6EE] border border-[#DFD4C0] rounded-[28px] p-6 space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#234B38] text-[#F3EBDD] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-[#234B38]">Jam Operasional</h3>
            <ul className="space-y-1 text-xs text-[#4A6B5B]">
              {contact.hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-2">
                  <span>{h.day}</span>
                  <strong className="font-mono text-[#234B38]">{h.time}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="gsap-stagger-card h-full flex flex-col bg-[#FAF6EE] border border-[#DFD4C0] rounded-[28px] p-6 space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E65B45] text-[#FAF6EE] flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-[#234B38]">Telepon &amp; WhatsApp</h3>
            <p className="text-xs font-mono text-[#4A6B5B]">{contact.phonePlaceholder}</p>
          </div>

          <div className="gsap-stagger-card h-full flex flex-col bg-[#FAF6EE] border border-[#DFD4C0] rounded-[28px] p-6 space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#234B38] text-[#F3EBDD] flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-[#234B38]">Email Resmi</h3>
            <p className="text-xs font-mono text-[#4A6B5B]">{contact.emailPlaceholder}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
