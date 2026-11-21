'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppIcon } from './AppIcon';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  dark?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  searchable = false,
  className = '',
  dark = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = searchable && query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sublabel || '').toLowerCase().includes(query.toLowerCase())
      )
    : options;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
          dark
            ? 'bg-[#143326] border-[#2D6A4F] text-[#FAF7F0] hover:border-[#40916C]'
            : 'bg-[#FAF7F0] border-[#DED6C5] text-[#1B4332] hover:border-[#2D6A4F] hover:bg-white'
        } ${isOpen ? 'ring-2 ring-[#2D6A4F]/25 border-[#2D6A4F]' : ''}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="opacity-60">{placeholder}</span>}
        </span>
        <AppIcon
          name="chevron-down"
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            dark ? 'text-[#A3C9B5]' : 'text-[#52796F]'
          } ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-1.5 rounded-2xl border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
            dark
              ? 'bg-[#10291F] border-[#2D6A4F] text-[#FAF7F0]'
              : 'bg-white border-[#DED6C5] text-[#1B4332]'
          }`}
        >
          {searchable && (
            <div className={`p-2 border-b ${dark ? 'border-[#2D6A4F]/60' : 'border-[#EDE7DA]'}`}>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-[#52796F]">
                  <AppIcon name="magnifying-glass" className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari..."
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none ${
                    dark
                      ? 'bg-[#1B4332] text-[#FAF7F0] placeholder-[#8FB8A3]'
                      : 'bg-[#F5F1E8] text-[#1B4332] placeholder-[#6B7F73]'
                  }`}
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-[11px] opacity-60">Tidak ada pilihan cocok</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#1B4332] text-[#FAF7F0] font-bold'
                        : dark
                        ? 'hover:bg-[#1B4332] text-[#E6EFE9]'
                        : 'hover:bg-[#F5F1E8] text-[#1B4332]'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span
                          className={`block text-[10px] truncate ${
                            isSelected ? 'text-[#A3C9B5]' : 'text-[#6B7F73]'
                          }`}
                        >
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <AppIcon name="check" className="w-3.5 h-3.5 shrink-0 text-[#FAF7F0]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
