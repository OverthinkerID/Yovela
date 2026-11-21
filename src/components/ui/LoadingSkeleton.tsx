'use client';

import React from 'react';

export const KpiSkeletonGrid: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4" aria-busy="true" aria-label="Memuat metrik">
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="yovela-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded-full skeleton-shimmer" />
          <div className="w-9 h-9 rounded-2xl skeleton-shimmer" />
        </div>
        <div className="h-7 w-28 rounded-xl skeleton-shimmer" />
        <div className="h-2.5 w-36 rounded-full skeleton-shimmer" />
      </div>
    ))}
  </div>
);

export const CardListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-2.5" aria-busy="true" aria-label="Memuat daftar">
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="p-3.5 rounded-2xl bg-[#F5F1E8] border border-[#E8E1D3] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-40 rounded-full skeleton-shimmer" />
            <div className="h-2.5 w-24 rounded-full skeleton-shimmer" />
          </div>
        </div>
        <div className="h-6 w-20 rounded-full skeleton-shimmer" />
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="p-4 space-y-3" aria-busy="true" aria-label="Memuat tabel">
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="h-11 w-full rounded-xl skeleton-shimmer" />
    ))}
  </div>
);
