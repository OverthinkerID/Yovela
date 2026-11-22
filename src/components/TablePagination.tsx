'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, safePage * pageSize);

  const pages: number[] = [];
  const startPage = Math.max(1, safePage - 2);
  const endPage = Math.min(totalPages, safePage + 2);
  for (let p = startPage; p <= endPage; p += 1) {
    pages.push(p);
  }

  return (
    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-3 text-slate-600">
        <span>
          Menampilkan <strong className="font-mono text-[#1B4332]">{startItem}–{endItem}</strong> dari{' '}
          <strong className="font-mono text-[#1B4332]">{totalItems}</strong> data
        </span>

        {onPageSizeChange && (
          <label className="inline-flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-[#1B4332] outline-none focus:border-[#1B4332] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Halaman sebelumnya"
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-[#F5F1E8] text-[#1B4332] font-semibold inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {startPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-[#F5F1E8] text-[#1B4332] font-mono font-bold cursor-pointer transition"
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-slate-400">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg font-mono font-bold cursor-pointer transition ${
              p === safePage
                ? 'bg-[#1B4332] text-[#FAF7F0] shadow-xs'
                : 'border border-slate-200 bg-white hover:bg-[#F5F1E8] text-[#1B4332]'
            }`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-slate-400">...</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-[#F5F1E8] text-[#1B4332] font-mono font-bold cursor-pointer transition"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Halaman berikutnya"
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-[#F5F1E8] text-[#1B4332] font-semibold inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
