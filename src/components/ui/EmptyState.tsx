'use client';

import React from 'react';
import Link from 'next/link';
import { AppIcon } from '../AppIcon';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'circle-info',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}) => {
  return (
    <div className="py-10 px-6 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center">
        <AppIcon name={icon} className="w-5 h-5" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-xs sm:text-sm font-extrabold text-[#1B4332]">{title}</h3>
        <p className="text-[11px] text-[#52796F] leading-relaxed">{description}</p>
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] text-xs font-bold transition"
        >
          <span>{actionLabel}</span>
          <AppIcon name="arrow-right" className="w-3.5 h-3.5" />
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] text-xs font-bold transition cursor-pointer"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
