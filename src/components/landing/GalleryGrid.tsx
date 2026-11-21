'use client';

import React from 'react';
import { GalleryConfigItem } from '../../config/landingConfig';
import { EditorialPhoto } from './EditorialPhoto';

interface GalleryGridProps {
  items: GalleryConfigItem[];
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ items }) => {
  return (
    <div className="gsap-horizontal-section overflow-hidden">
      <div className="gsap-horizontal-track flex gap-5 sm:gap-7 px-4 sm:px-6 lg:px-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="snap-start shrink-0 w-[82vw] sm:w-[360px] lg:w-[420px] group space-y-3"
          >
            <div className="rounded-[28px] overflow-hidden border border-[#DFD4C0] shadow-md">
              <EditorialPhoto
                src={item.imageSrc}
                alt={item.title}
                caption={item.caption}
                badge={item.tag}
                variant={idx % 2 === 0 ? 'suite' : 'detail'}
                className="h-[280px] sm:h-[340px] w-full"
              />
            </div>
            <div className="flex items-baseline justify-between gap-2 px-1">
              <h3 className="font-editorial text-xl font-semibold text-[#234B38]">{item.title}</h3>
              <span className="font-mono text-[11px] font-bold text-[#E65B45]">0{idx + 1}</span>
            </div>
            <p className="text-xs text-[#4A6B5B] leading-relaxed px-1">{item.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
