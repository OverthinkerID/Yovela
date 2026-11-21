'use client';

import React, { useEffect } from 'react';
import { AppIcon } from '../AppIcon';

interface ModalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export const ModalDrawer: React.FC<ModalDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-lg',
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0E261C]/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 print:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`bg-[#FAF7F0] border border-[#DED6C5] rounded-t-3xl sm:rounded-3xl w-full ${maxWidthClass} p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150`}
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#DED6C5] rounded-full mx-auto sm:hidden" />
        <div className="flex items-start justify-between gap-3 border-b border-[#E8E1D3] pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#1B4332]">{title}</h3>
            {subtitle && <p className="text-[11px] text-[#52796F] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="w-8 h-8 rounded-full bg-[#F5F1E8] hover:bg-[#E8E1D3] text-[#1B4332] flex items-center justify-center cursor-pointer transition shrink-0"
          >
            <AppIcon name="xmark" className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
