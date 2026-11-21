'use client';

import React from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { TreatmentConfigItem } from '../../config/landingConfig';

interface TreatmentCardProps {
  item: TreatmentConfigItem;
  index: number;
  onExplore: (item: TreatmentConfigItem) => void;
}

export const TreatmentCard: React.FC<TreatmentCardProps> = ({ item, index, onExplore }) => {
  return (
    <article className="gsap-stagger-card group bg-[#FAF6EE] border border-[#DFD4C0] rounded-[28px] p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#234B38] hover:shadow-xl hover:shadow-[#234B38]/10">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full bg-[#F3EBDD] border border-[#DFD4C0] text-[#234B38] text-[10px] font-bold uppercase tracking-wider">
            {item.category}
          </span>
          <span className="font-mono text-[11px] font-bold text-[#E65B45]">
            0{index + 1}
          </span>
        </div>

        <div>
          <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#234B38] group-hover:text-[#E65B45] transition-colors leading-snug">
            {item.title}
          </h3>
          <p className="text-xs font-semibold text-[#4A6B5B] mt-1">{item.subtitle}</p>
        </div>

        <p className="text-xs sm:text-sm text-[#4A6B5B] leading-relaxed">
          {item.description}
        </p>

        <ul className="space-y-1.5 pt-1">
          {item.highlights.map((hl) => (
            <li key={hl} className="flex items-center gap-2 text-[11px] font-semibold text-[#234B38]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E65B45] shrink-0" />
              <span>{hl}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-4 border-t border-[#DFD4C0] flex items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#4A6B5B]">
            <Clock className="w-3 h-3" />
            {item.duration}
          </span>
          <p className="text-xs font-extrabold text-[#234B38] mt-0.5">{item.priceLabel}</p>
        </div>

        <button
          type="button"
          onClick={() => onExplore(item)}
          className="px-4 py-2.5 rounded-full bg-[#234B38] group-hover:bg-[#E65B45] text-[#F3EBDD] text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors duration-200 cursor-pointer"
        >
          <span>Explore Treatment</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};
