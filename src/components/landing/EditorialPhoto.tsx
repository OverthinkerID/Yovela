'use client';

import React, { useState } from 'react';

interface EditorialPhotoProps {
  src?: string;
  alt: string;
  caption?: string;
  badge?: string;
  variant?: 'clinic' | 'doctor' | 'suite' | 'detail';
  className?: string;
  priority?: boolean;
}

export const EditorialPhoto: React.FC<EditorialPhotoProps> = ({
  src,
  alt,
  caption,
  badge,
  variant = 'clinic',
  className = '',
  priority = false,
}) => {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <div className={`relative overflow-hidden bg-[#173326] ${className}`}>
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {badge && (
          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#F3EBDD]/90 backdrop-blur-md text-[#234B38] text-[10px] font-bold uppercase tracking-wider">
            {badge}
          </span>
        )}
        {caption && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#163224]/90 via-[#163224]/40 to-transparent text-[#F3EBDD]">
            <p className="text-[11px] font-medium">{caption}</p>
          </div>
        )}
      </div>
    );
  }

  const bgVariants = {
    clinic: 'from-[#234B38] via-[#1C3D2D] to-[#12281D]',
    doctor: 'from-[#1D402F] via-[#234B38] to-[#142D21]',
    suite: 'from-[#28543F] via-[#234B38] to-[#173326]',
    detail: 'from-[#E8DEC9] via-[#F3EBDD] to-[#DFD3BA]',
  };

  const isLight = variant === 'detail';

  return (
    <div
      aria-label={alt}
      className={`relative overflow-hidden bg-gradient-to-br ${bgVariants[variant]} ${
        isLight ? 'text-[#234B38]' : 'text-[#F3EBDD]'
      } flex flex-col justify-between p-6 sm:p-8 select-none ${className}`}
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 w-56 h-56 rounded-full blur-2xl ${
          isLight ? 'bg-[#E65B45]/18' : 'bg-[#E65B45]/22'
        }`}
      />
      <div
        className={`pointer-events-none absolute -left-10 bottom-10 w-44 h-44 rounded-full blur-2xl ${
          isLight ? 'bg-[#234B38]/12' : 'bg-[#F3EBDD]/10'
        }`}
      />

      <div className="relative z-10 flex items-center justify-between gap-2">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] border ${
            isLight
              ? 'border-[#234B38]/20 bg-[#FAF6EE]/80 text-[#234B38]'
              : 'border-[#F3EBDD]/20 bg-[#F3EBDD]/10 text-[#F3EBDD]'
          }`}
        >
          {badge || 'Editorial Visual Slot'}
        </span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#E65B45]" />
      </div>

      <div className="relative z-10 my-auto py-6 flex items-center justify-center">
        {variant === 'doctor' ? (
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-[#F3EBDD]/25 bg-[#F3EBDD]/8 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-[#F3EBDD]/85" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        ) : (
          <div
            className={`w-28 h-28 sm:w-36 sm:h-36 rounded-[36px] border flex items-center justify-center ${
              isLight ? 'border-[#234B38]/15 bg-[#FAF6EE]/60' : 'border-[#F3EBDD]/20 bg-[#F3EBDD]/8'
            }`}
          >
            <svg
              viewBox="0 0 512 512"
              className={`w-14 h-14 ${isLight ? 'fill-[#234B38]/80' : 'fill-[#F3EBDD]/85'}`}
            >
              <path d="M416 112c-35.3 0-64 28.7-64 64v51.2c0 23.4-12.2 44.9-32.3 56.8L272 312.6l-47.7-28.6c-20.1-12-32.3-33.5-32.3-56.8V176c0-35.3-28.7-64-64-64S64 140.7 64 176c0 86.8 52.3 162.7 128 193.3V432c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V369.3c75.7-30.6 128-106.5 128-193.3c0-35.3-28.7-64-64-64z" />
            </svg>
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-end justify-between gap-3 pt-3 border-t border-current/15">
        <p className="text-[11px] font-medium opacity-85 leading-snug">{caption || alt}</p>
        <span className="text-[10px] font-mono opacity-60 shrink-0">PHOTO SLOT</span>
      </div>
    </div>
  );
};
