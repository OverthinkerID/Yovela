'use client';

import React from 'react';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  theme?: 'light' | 'dark';
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  align = 'left',
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`space-y-4 ${align === 'center' ? 'text-center mx-auto max-w-3xl' : 'max-w-2xl'}`}>
      <div className={`inline-flex items-center gap-2.5 ${align === 'center' ? 'justify-center' : ''}`}>
        <span className="w-6 h-[2px] bg-[#E65B45] rounded-full" />
        <span
          className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
            isDark ? 'text-[#F3EBDD]/80' : 'text-[#234B38]/75'
          }`}
        >
          {eyebrow}
        </span>
      </div>

      <h2
        className={`gsap-text-reveal font-editorial text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.12] tracking-tight ${
          isDark ? 'text-[#F3EBDD]' : 'text-[#234B38]'
        }`}
      >
        {title}
      </h2>

      {description && (
        <p
          className={`gsap-fade-up text-sm sm:text-base leading-relaxed ${
            isDark ? 'text-[#F3EBDD]/80' : 'text-[#4A6B5B]'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
};
