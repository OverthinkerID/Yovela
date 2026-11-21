'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import LoginPage from '../login/page';

export default function YovelaPortalEntryPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace('/dashboard');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0E261C] flex items-center justify-center text-[#B7D3C4] text-xs font-semibold">
        Membuka Portal Yovela Dental Clinic...
      </main>
    );
  }

  return <LoginPage />;
}
