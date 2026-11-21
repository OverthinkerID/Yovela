'use client';

import React from 'react';

export type BadgeTone = 'forest' | 'emerald' | 'amber' | 'tomato' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}

const BADGE_STYLES: Record<BadgeTone, string> = {
  forest: 'bg-[#1B4332] text-[#FAF7F0] border-[#1B4332]',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  tomato: 'bg-[#E63946] text-white border-[#E63946]',
  neutral: 'bg-white text-[#1B4332] border-[#DED6C5]',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone = 'neutral', dot = false }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${BADGE_STYLES[tone]}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-85" />}
      <span>{label}</span>
    </span>
  );
};
