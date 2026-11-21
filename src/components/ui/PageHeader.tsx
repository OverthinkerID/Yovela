'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="yovela-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="min-w-0">
        <h1 className="text-sm sm:text-base font-extrabold text-[#1B4332] tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[10px] sm:text-[11px] text-[#52796F] mt-0.5 leading-snug">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};
