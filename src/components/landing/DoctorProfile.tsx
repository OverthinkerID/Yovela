'use client';

import React from 'react';
import { Award, GraduationCap, Stethoscope } from 'lucide-react';
import { DoctorConfig } from '../../config/landingConfig';
import { EditorialPhoto } from './EditorialPhoto';

interface DoctorProfileProps {
  doctor: DoctorConfig;
}

export const DoctorProfile: React.FC<DoctorProfileProps> = ({ doctor }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-[#FAF6EE] border border-[#DFD4C0] rounded-[36px] p-6 sm:p-10 lg:p-12 shadow-sm">
      {/* Kiri: Foto Dokter */}
      <div className="lg:col-span-5">
        <div className="gsap-image-mask rounded-[28px] overflow-hidden border border-[#DFD4C0] shadow-lg max-w-[400px] mx-auto">
          <EditorialPhoto
            src={doctor.imageSrc}
            alt={doctor.name}
            caption={doctor.credentialPlaceholder}
            badge={doctor.isPlaceholder ? 'Editable Doctor Profile' : 'Lead Dentist'}
            variant="doctor"
            className="aspect-[3/4] w-full"
          />
        </div>
      </div>

      {/* Kanan: Detail Kredensial, Pendidikan & Filosofi */}
      <div className="lg:col-span-7 space-y-6">
        <div className="space-y-2">
          {doctor.isPlaceholder && (
            <span className="inline-block px-3 py-1 rounded-full bg-[#E65B45]/12 text-[#E65B45] text-[10px] font-bold uppercase tracking-wider">
              Placeholder — Sesuaikan Nama &amp; Kredensial Resmi di src/config/landingConfig.ts
            </span>
          )}
          <h3 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#234B38] leading-tight">
            {doctor.name}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-[#E65B45]">{doctor.role}</p>
        </div>

        <blockquote className="font-editorial italic text-lg sm:text-xl text-[#234B38]/90 leading-relaxed border-l-2 border-[#E65B45] pl-4">
          {doctor.philosophy}
        </blockquote>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-[#F3EBDD] border border-[#DFD4C0] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#234B38]">
              <GraduationCap className="w-4 h-4 text-[#E65B45]" />
              <span>Pendidikan &amp; Pelatihan</span>
            </div>
            <ul className="space-y-1 text-xs text-[#4A6B5B]">
              {doctor.education.map((edu) => (
                <li key={edu}>• {edu}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3EBDD] border border-[#DFD4C0] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#234B38]">
              <Award className="w-4 h-4 text-[#E65B45]" />
              <span>Pengalaman Praktik</span>
            </div>
            {doctor.experienceList && doctor.experienceList.length > 0 ? (
              <ul className="space-y-1 text-xs text-[#4A6B5B]">
                {doctor.experienceList.map((exp) => (
                  <li key={exp}>• {exp}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#4A6B5B] leading-relaxed">{doctor.experience}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#234B38]">
            <Stethoscope className="w-4 h-4 text-[#E65B45]" />
            <span>Bidang Keahlian</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {doctor.specialties.map((spec) => (
              <span
                key={spec}
                className="px-3.5 py-1.5 rounded-full bg-[#234B38] text-[#F3EBDD] text-[11px] font-semibold"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
