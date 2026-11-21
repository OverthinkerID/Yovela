'use client';

import React from 'react';
import { AppIcon } from '../AppIcon';

export type KpiTone = 'forest' | 'emerald' | 'tomato' | 'amber';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  tone?: KpiTone;
  progressPercent?: number;
  onClick?: () => void;
}

const TONE_CLASSES: Record<KpiTone, { iconBg: string; valueText: string; bar: string }> = {
  forest: {
    iconBg: 'bg-[#1B4332] text-[#FAF7F0]',
    valueText: 'text-[#1B4332]',
    bar: 'bg-[#2D6A4F]',
  },
  emerald: {
    iconBg: 'bg-[#2D6A4F]/15 text-[#1B4332]',
    valueText: 'text-[#1B4332]',
    bar: 'bg-[#2D6A4F]',
  },
  tomato: {
    iconBg: 'bg-[#E63946]/15 text-[#E63946]',
    valueText: 'text-[#E63946]',
    bar: 'bg-[#E63946]',
  },
  amber: {
    iconBg: 'bg-amber-500/15 text-amber-700',
    valueText: 'text-amber-700',
    bar: 'bg-amber-500',
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  tone = 'forest',
  progressPercent,
  onClick,
}) => {
  const styles = TONE_CLASSES[tone];
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`yovela-card text-left w-full h-full min-h-[116px] flex flex-col justify-between gap-3 p-4 sm:p-5 hover-lift ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] sm:text-[11px] font-bold text-[#52796F] uppercase tracking-wider leading-tight line-clamp-2">
          {label}
        </span>
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
          <AppIcon name={icon} className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-auto">
        <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight ${styles.valueText}`}>
          {value}
        </h3>
        {typeof progressPercent === 'number' && (
          <div className="w-full h-1.5 rounded-full bg-[#E8E1D3] mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        )}
        {subtitle && (
          <p className="text-[10px] sm:text-[11px] text-[#52796F] mt-1 leading-snug">{subtitle}</p>
        )}
      </div>
    </Tag>
  );
};
