'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { AppIcon } from './AppIcon';
import { EmptyState } from './ui/EmptyState';
import { CardListSkeleton } from './ui/LoadingSkeleton';
import { useToast } from '../context/ToastContext';

type CategoryFilter = 'ALL' | 'JADWAL' | 'ANTREAN' | 'KASIR' | 'STOK' | 'SATUSEHAT';

interface NotificationEntry {
  id: string;
  category: 'JADWAL' | 'ANTREAN' | 'KASIR' | 'STOK' | 'SATUSEHAT';
  title: string;
  subtitle: string;
  href: string;
  type: 'info' | 'warning' | 'alert';
  timestamp: string;
  isRead: boolean;
}

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'JADWAL', label: 'Jadwal' },
  { key: 'ANTREAN', label: 'Antrean' },
  { key: 'KASIR', label: 'Kasir' },
  { key: 'STOK', label: 'Stok' },
  { key: 'SATUSEHAT', label: 'SATUSEHAT' },
];

export const NotificationCenter: React.FC<{ activePath?: string }> = ({ activePath }) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (withSpinner = false) => {
    if (withSpinner) setIsLoading(true);
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
    } finally {
      if (withSpinner) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(false);
    const timer = setInterval(() => fetchNotifications(false), 30000);
    return () => clearInterval(timer);
  }, [fetchNotifications, activePath]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', id }),
    }).catch(() => {});
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read', ids: unreadIds }),
    }).catch(() => {});
    showToast('Semua notifikasi ditandai sudah dibaca.', 'success');
  };

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filtered =
    categoryFilter === 'ALL'
      ? notifications
      : notifications.filter((n) => n.category === categoryFilter);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) fetchNotifications(true);
        }}
        aria-label="Pusat Notifikasi Klinik"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Notifikasi Operasional Klinik"
        className="relative w-9 h-9 rounded-full bg-white hover:bg-[#F5F1E8] border border-[#DED6C5] text-[#1B4332] flex items-center justify-center transition cursor-pointer shadow-2xs"
      >
        <AppIcon name="bell" className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E63946] text-white text-[10px] font-black font-mono flex items-center justify-center shadow-sm border-2 border-[#FAF7F0]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-88 max-w-[calc(100vw-1.5rem)] bg-[#FAF7F0] border border-[#DED6C5] rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 pb-2.5 border-b border-[#E8E1D3] flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-extrabold text-[#1B4332] block">Pusat Notifikasi</span>
              <span className="text-[10px] text-[#52796F]">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua telah dibaca'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-[#2D6A4F] hover:text-[#E63946] cursor-pointer"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>
          </div>

          {/* Filter Kategori */}
          <div className="px-3 py-2 border-b border-[#E8E1D3] flex items-center gap-1 overflow-x-auto">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategoryFilter(tab.key)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                  categoryFilter === tab.key
                    ? 'bg-[#1B4332] text-[#FAF7F0]'
                    : 'bg-[#F5F1E8] text-[#52796F] hover:text-[#1B4332]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#E8E1D3]">
            {isLoading ? (
              <div className="p-3">
                <CardListSkeleton rows={3} />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="bell"
                title="Tidak Ada Notifikasi"
                description={
                  categoryFilter === 'ALL'
                    ? 'Semua antrean, stok, dan tagihan kasir dalam kondisi aman.'
                    : `Belum ada notifikasi pada kategori ${categoryFilter}.`
                }
              />
            ) : (
              filtered.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 transition flex items-start gap-3 ${
                    n.isRead ? 'opacity-65' : 'bg-white/60'
                  }`}
                >
                  <span
                    className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                      n.type === 'alert'
                        ? 'bg-[#E63946]'
                        : n.type === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-[#2D6A4F]'
                    }`}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Link
                      href={n.href}
                      onClick={() => {
                        if (!n.isRead) markAsRead(n.id);
                        setIsOpen(false);
                      }}
                      className="block group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono font-bold uppercase text-[#52796F]">
                          {n.category}
                        </span>
                        <span className="text-[9px] font-mono text-[#52796F]">
                          {formatTimestamp(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#1B4332] group-hover:text-[#E63946] leading-snug mt-0.5 transition">
                        {n.title}
                      </p>
                      <p className="text-[10px] text-[#52796F] mt-0.5 leading-relaxed">{n.subtitle}</p>
                    </Link>

                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(n.id)}
                        className="text-[10px] font-bold text-[#2D6A4F] hover:text-[#1B4332] cursor-pointer"
                      >
                        ✓ Tandai sudah dibaca
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
