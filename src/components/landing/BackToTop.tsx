'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 520);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Kembali ke atas"
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-[#234B38] hover:bg-[#E65B45] text-[#F3EBDD] shadow-xl border border-[#F3EBDD]/20 flex items-center justify-center transition-all duration-200 cursor-pointer hover:-translate-y-1"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
};
