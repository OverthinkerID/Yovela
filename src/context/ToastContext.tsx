'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppIcon } from '../components/AppIcon';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const styleMap: Record<ToastVariant, { bg: string; icon: string; badge: string }> = {
    success: {
      bg: 'bg-[#1B4332] border-[#40916C] text-[#FAF7F0]',
      icon: 'circle-check',
      badge: 'bg-[#40916C] text-[#FAF7F0]',
    },
    error: {
      bg: 'bg-[#E63946] border-[#FF8A93] text-white',
      icon: 'circle-exclamation',
      badge: 'bg-white/20 text-white',
    },
    warning: {
      bg: 'bg-[#92400E] border-[#F59E0B] text-[#FEF3C7]',
      icon: 'triangle-exclamation',
      badge: 'bg-[#F59E0B] text-slate-950',
    },
    info: {
      bg: 'bg-[#0E261C] border-[#2D6A4F] text-[#FAF7F0]',
      icon: 'circle-info',
      badge: 'bg-[#2D6A4F] text-[#FAF7F0]',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-20 md:bottom-6 right-4 z-[90] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none print:hidden"
      >
        {toasts.map((t) => {
          const st = styleMap[t.variant];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-right-4 duration-200 ${st.bg}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${st.badge}`}>
                <AppIcon name={st.icon} className="w-3.5 h-3.5" />
              </span>
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="opacity-70 hover:opacity-100 cursor-pointer shrink-0"
              >
                <AppIcon name="xmark" className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
