'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { TestimonialConfigItem } from '../../config/landingConfig';

interface TestimonialCardProps {
  item: TestimonialConfigItem;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ item }) => {
  return (
    <article className="bg-[#FAF6EE] border border-[#DFD4C0] rounded-[28px] p-6 sm:p-7 flex flex-col gap-5 h-full shadow-xs">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[#E65B45]">
            {Array.from({ length: item.rating }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-[#E65B45]" />
            ))}
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              item.isPlaceholder
                ? 'bg-[#E65B45]/12 text-[#E65B45]'
                : 'bg-[#234B38] text-[#F3EBDD]'
            }`}
          >
            {item.sourceLabel}
          </span>
        </div>

        <p className="font-editorial italic text-base sm:text-lg text-[#234B38] leading-relaxed line-clamp-4">
          &ldquo;{item.quote}&rdquo;
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-[#DFD4C0]">
        <p className="text-xs font-extrabold text-[#234B38]">{item.patientName}</p>
        <p className="text-[11px] text-[#4A6B5B] mt-0.5">{item.treatment}</p>
      </div>
    </article>
  );
};
