'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppIcon } from "@/components/AppIcon";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, UserRole, StaffAccount } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { NotificationCenter } from '../../components/NotificationCenter';

type MobileSheetType = 'lainnya' | 'profil' | null;
type SettingsTabType = 'akun' | 'role' | 'whatsapp' | 'tentang';

interface RegTokenItem {
  id: string;
  code: string;
  role: UserRole;
  roleLabel: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
}


const DEFAULT_PERMS: Record<UserRole, string[]> = {
  DOKTER: ['dashboard', 'jadwal', 'pasien', 'antrean', 'display-antrean', 'poli', 'satusehat', 'stok', 'kasir', 'laporan', 'pengeluaran'],
  PENDAFTARAN: ['dashboard', 'jadwal', 'pasien', 'antrean', 'display-antrean', 'stok'],
  KASIR: ['dashboard', 'kasir', 'laporan'],
};

const ALL_MODULE_PERMS: { key: string; label: string; desc: string }[] = [
  { key: 'dashboard', label: 'Dasbor Utama', desc: 'Ringkasan harian & antrean live' },
  { key: 'jadwal', label: 'Jadwal Janji Temu', desc: 'Booking dokter & WA reminder' },
  { key: 'pasien', label: 'Pendaftaran Pasien', desc: 'Registrasi pasien baru & RM' },
  { key: 'antrean', label: 'Antrean Hari Ini', desc: 'Pemanggilan antrean ke ruang poli' },
  { key: 'display-antrean', label: 'Display TV Monitor', desc: 'Layar panggilan ruang tunggu' },
  { key: 'poli', label: 'Pemeriksaan (Poli)', desc: 'Odontogram FDI, SOAP & Consent' },
  { key: 'satusehat', label: 'Bridging SATUSEHAT', desc: 'Sinkronisasi FHIR R4 Kemenkes' },
  { key: 'stok', label: 'Stok BHP & Logistik', desc: 'Kartu stok bahan & restock otomatis' },
  { key: 'kasir', label: 'Kasir & Billing', desc: 'Pembayaran QRIS, EDC, Tunai & Cicilan' },
  { key: 'laporan', label: 'Laporan Keuangan', desc: 'Rekap omset & ekspor CSV/PDF' },
  { key: 'pengeluaran', label: 'Pengeluaran & Laba (Admin)', desc: 'Catat gaji, listrik, alat & laba bersih' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading, logout, loadStaffUsers, updateStaffUsers } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const pathname = usePathname();
  const router = useRouter();

  const isTVDisplay = pathname?.includes('/display-antrean');

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchSidebarQuery, setSearchSidebarQuery] = useState('');

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [mobileSheet, setMobileSheet] = useState<MobileSheetType>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTabType>('akun');
  const [accountFormList, setAccountFormList] = useState<StaffAccount[]>([]);
  const [regTokens, setRegTokens] = useState<RegTokenItem[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>(DEFAULT_PERMS);
  const [savingRolePerm, setSavingRolePerm] = useState<UserRole | null>(null);
  const [waConfig, setWaConfig] = useState<{ enabled: boolean; provider: 'FONNTE' | 'WABLAS'; apiToken: string; endpointUrl: string; adminPhone: string }>({
    enabled: false,
    provider: 'FONNTE',
    apiToken: '',
    endpointUrl: 'https://api.fonnte.com/send',
    adminPhone: '',
  });
  const [waTestPhone, setWaTestPhone] = useState('');
  const [isSavingWa, setIsSavingWa] = useState(false);
  const [isTestingWa, setIsTestingWa] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTVDisplay && !isLoading && !currentUser && pathname !== '/login') {
      router.replace('/yovela');
    }
  }, [currentUser, isLoading, pathname, router, isTVDisplay]);

  // Auto-collapse Floating Dock saat masuk halaman Poli agar Odontogram FDI lega
  useEffect(() => {
    setMobileSheet(null);
    if (pathname?.startsWith('/poli')) {
      setIsCollapsed(true);
    }
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        setMobileSheet(null);
        setShowSettingsModal(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchPermissions = useCallback(async () => {
    if (!currentUser || isTVDisplay) return;
    try {
      const res = await fetch('/api/auth/permissions', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.permissions) setRolePermissions(data.permissions);
      }
    } catch {}
  }, [currentUser, isTVDisplay]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions, pathname]);

  const loadTokens = async () => {
    try {
      const res = await fetch('/api/auth/tokens', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRegTokens(data.tokens || []);
      }
    } catch {}
  };

  const loadWaConfig = async () => {
    try {
      const res = await fetch('/api/settings/whatsapp', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setWaConfig({
            enabled: Boolean(data.config.enabled),
            provider: data.config.provider === 'WABLAS' ? 'WABLAS' : 'FONNTE',
            apiToken: data.config.apiToken || '',
            endpointUrl: data.config.endpointUrl || 'https://api.fonnte.com/send',
            adminPhone: data.config.adminPhone || '',
          });
          setWaTestPhone(data.config.adminPhone || '');
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (showSettingsModal && currentUser?.role === 'DOKTER') {
      loadStaffUsers().then((list) => {
        setAccountFormList(list.map((u) => ({ ...u, newPassword: '' })));
      });
      loadTokens();
      fetchPermissions();
      loadWaConfig();
    }
  }, [showSettingsModal, currentUser, loadStaffUsers, fetchPermissions]);

  if (isTVDisplay) {
    return <main className="min-h-screen bg-[#0E261C] w-full">{children}</main>;
  }

  if (isLoading || !currentUser) {
    return (
      <main className="min-h-screen bg-[#0E261C] w-full flex items-center justify-center text-[#B7D3C4] text-xs">
        Memuat sesi workspace...
      </main>
    );
  }

  const activeUserName = currentUser.name;
  const activeUserLabel = currentUser.roleLabel;
  const isDoctorAdmin = currentUser.role === 'DOKTER';

  const menuList: {
    permKey: string;
    href: string;
    label: string;
    icon: string;
    category: 'home' | 'pasien' | 'klinis' | 'kasir';
    isExternal?: boolean;
  }[] = [
    { permKey: 'dashboard', href: '/dashboard', label: 'Dasbor Utama', icon: 'house-chimney', category: 'home' },
    { permKey: 'jadwal', href: '/jadwal', label: 'Jadwal Janji Temu', icon: 'calendar-check', category: 'pasien' },
    { permKey: 'pasien', href: '/pasien', label: 'Pendaftaran Pasien', icon: 'user-plus', category: 'pasien' },
    { permKey: 'antrean', href: '/antrean', label: 'Antrean Hari Ini', icon: 'clock-rotate-left', category: 'pasien' },
    { permKey: 'display-antrean', href: '/display-antrean', label: 'Display TV Monitor', icon: 'tv', category: 'pasien', isExternal: true },
    { permKey: 'poli', href: '/poli', label: 'Pemeriksaan (Poli)', icon: 'tooth', category: 'klinis' },
    { permKey: 'satusehat', href: '/satusehat', label: 'Bridging SATUSEHAT', icon: 'hospital', category: 'klinis' },
    { permKey: 'stok', href: '/stok', label: 'Stok BHP & Logistik', icon: 'box', category: 'klinis' },
    { permKey: 'kasir', href: '/kasir', label: 'Kasir & Billing', icon: 'receipt', category: 'kasir' },
    { permKey: 'laporan', href: '/laporan', label: 'Laporan Keuangan', icon: 'chart-pie', category: 'kasir' },
  ];

  const myPerms = rolePermissions[currentUser.role] || DEFAULT_PERMS[currentUser.role] || ['dashboard'];
  const authorizedMenuList = menuList.filter((m) => myPerms.includes(m.permKey));

  const filteredMenuList = authorizedMenuList.filter((m) =>
    m.label.toLowerCase().includes(searchSidebarQuery.toLowerCase())
  );

  const lainnyaItems = authorizedMenuList.filter(
    (m) => !['dashboard', 'jadwal', 'pasien'].includes(m.permKey)
  );

  const normalizedPath = pathname?.replace(/\/$/, '') || '/dashboard';
  const matchedMenu = menuList.find((m) => normalizedPath.startsWith(m.href));
  const isRouteAuthorized = !matchedMenu || myPerms.includes(matchedMenu.permKey);
  const canAccessJadwal = myPerms.includes('jadwal');
  const canAccessPasien = myPerms.includes('pasien');
  const isHomeActive = normalizedPath === '/dashboard';
  const isJadwalActive = normalizedPath.startsWith('/jadwal');
  const isPasienActive = normalizedPath.startsWith('/pasien');
  const isLainnyaRouteActive = !isHomeActive && !isJadwalActive && !isPasienActive;

  const handleFullLogout = () => {
    setIsProfileMenuOpen(false);
    setMobileSheet(null);
    showToast('Anda telah keluar dari sesi Yovela Dental Clinic.', 'info');
    logout();
  };

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    showToast(`Tampilan diubah ke ${next === 'dark' ? 'Dark Forest Mode' : 'Light Oat Mode'}.`, 'info');
  };

  const handleGenerateToken = async (role: UserRole) => {
    try {
      const res = await fetch('/api/auth/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, maxUses: 5 }),
      });
      if (res.ok) {
        await loadTokens();
        showToast(`Token registrasi baru untuk ${role} berhasil diterbitkan!`, 'success');
      } else {
        showToast('Gagal menerbitkan token registrasi.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan saat membuat token.', 'error');
    }
  };

  const handleTogglePermission = (role: UserRole, permKey: string) => {
    if (permKey === 'dashboard') return;
    setRolePermissions((prev) => {
      const current = prev[role] || [];
      const exists = current.includes(permKey);
      const updated = exists ? current.filter((p) => p !== permKey) : [...current, permKey];
      return { ...prev, [role]: updated };
    });
  };

  const handleSaveRolePermissions = async (role: UserRole) => {
    setSavingRolePerm(role);
    try {
      const res = await fetch('/api/auth/permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissions: rolePermissions[role] }),
      });
      if (res.ok) {
        showToast(`Wewenang akses untuk role ${role} berhasil diperbarui!`, 'success');
        await fetchPermissions();
      } else {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan wewenang role.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server untuk menyimpan wewenang.', 'error');
    } finally {
      setSavingRolePerm(null);
    }
  };

  const openSettings = (tab: SettingsTabType) => {
    setSettingsTab(isDoctorAdmin ? tab : 'tentang');
    setShowSettingsModal(true);
    setIsProfileMenuOpen(false);
    setMobileSheet(null);
  };

  const hasLainnyaAccess = lainnyaItems.length > 0 || isDoctorAdmin;

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#1B4332] flex antialiased relative w-full">

      {/* DESKTOP FLOATING GLASS DOCK (Forest Green + Oat Milk + Red Tomato) */}
      <aside
        className={`hidden md:flex sticky top-3 h-[calc(100vh-1.5rem)] ml-3 my-3 rounded-[28px] bg-[#1B4332]/96 backdrop-blur-xl border border-[#2D6A4F] shadow-2xl shadow-[#1B4332]/25 text-[#FAF7F0] flex-col justify-between shrink-0 transition-all duration-300 ease-out z-40 select-none print:hidden ${
          isCollapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Perluas Floating Dock' : 'Ciutkan ke Mode Ikon Melayang'}
          className="absolute -right-3 top-7 z-50 w-6 h-6 rounded-full bg-[#E63946] hover:bg-[#D62828] text-white border-2 border-[#F5F1E8] shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
        >
          <AppIcon name={isCollapsed ? 'arrow-right' : 'arrow-left'} className="w-3 h-3" />
        </button>

        <div className="flex flex-col min-h-0 flex-1">
          <div
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-4 border-b border-white/10 flex items-center justify-between cursor-pointer group hover:bg-white/5 rounded-t-[28px] transition"
            title={isCollapsed ? 'Klik untuk memperluas menu' : 'Klik untuk menciutkan menu'}
          >
            <div className={`flex items-center gap-3 overflow-hidden w-full ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-2xl bg-[#FAF7F0]/15 border border-[#FAF7F0]/25 text-[#FAF7F0] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
                <svg viewBox="0 0 512 512" className="w-5 h-5 fill-[#FAF7F0]">
                  <path d="M416 112c-35.3 0-64 28.7-64 64v51.2c0 23.4-12.2 44.9-32.3 56.8L272 312.6l-47.7-28.6c-20.1-12-32.3-33.5-32.3-56.8V176c0-35.3-28.7-64-64-64S64 140.7 64 176c0 86.8 52.3 162.7 128 193.3V432c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V369.3c75.7-30.6 128-106.5 128-193.3c0-35.3-28.7-64-64-64z" />
                </svg>
              </div>
              {!isCollapsed && (
                <div className="truncate leading-tight">
                  <h2 className="font-extrabold text-sm text-[#FAF7F0] tracking-tight">Yovela Dental</h2>
                  <span className="text-[10px] text-[#95D5B2] font-semibold block">SIM-RME Studio</span>
                </div>
              )}
            </div>
          </div>

          {!isCollapsed && (
            <div className="p-3 pb-1">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#95D5B2] text-xs">
                  <AppIcon name="magnifying-glass" />
                </span>
                <input
                  type="text"
                  value={searchSidebarQuery}
                  onChange={(e) => setSearchSidebarQuery(e.target.value)}
                  placeholder="Cari menu..."
                  className="w-full bg-[#0E261C]/80 border border-[#2D6A4F] rounded-2xl pl-8 pr-3 py-1.5 text-xs text-[#FAF7F0] placeholder-[#8FB8A3] focus:outline-none focus:border-[#FAF7F0] transition"
                />
              </div>
            </div>
          )}

          <nav className={`p-3 space-y-1.5 text-xs font-semibold flex-1 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto'}`}>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-[#8FB8A3] uppercase tracking-wider mb-1">
                WORKSPACE MENU
              </p>
            )}
            {filteredMenuList.map((m) => {
              const isActive = pathname === m.href;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  target={m.isExternal ? '_blank' : '_self'}
                  rel={m.isExternal ? 'noopener noreferrer' : undefined}
                  className={`relative group/item w-full flex items-center rounded-2xl transition-all duration-150 cursor-pointer ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#FAF7F0] text-[#1B4332] font-black shadow-lg shadow-black/15'
                      : 'text-[#C7DFD1] hover:bg-white/10 hover:text-white font-bold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AppIcon name={m.icon} className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{m.label}</span>}
                  </div>
                  {m.isExternal && !isCollapsed && (
                    <AppIcon name="arrow-up-right-from-square" className="w-3 h-3 opacity-60" />
                  )}

                  {isCollapsed && (
                    <span className="pointer-events-none opacity-0 group-hover/item:opacity-100 translate-x-1 group-hover/item:translate-x-0 transition-all duration-150 absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#0E261C] text-[#FAF7F0] text-[11px] font-bold whitespace-nowrap shadow-xl border border-[#2D6A4F] z-50">
                      {m.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 border-t border-white/10 text-center space-y-1.5">
          {!isCollapsed ? (
            <>
              <Link
                href="/landingpage"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-[10px] text-[#95D5B2] hover:text-white font-bold transition"
              >
                <span>Buka Landing Page</span>
                <AppIcon name="arrow-up-right-from-square" className="w-2.5 h-2.5" />
              </Link>
              <p className="text-[10px] text-[#8FB8A3] font-medium">v3.3 • Overthinker Studio</p>
            </>
          ) : (
            <Link
              href="/landingpage"
              target="_blank"
              className="w-9 h-9 mx-auto rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[10px] text-[#FAF7F0] font-mono font-bold hover:bg-[#E63946] transition"
              title="Buka Landing Page Publik"
            >
              Web
            </Link>
          )}
        </div>
      </aside>

      {/* KONTEN UTAMA & FLOATING GLASS HEADER */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden pb-28 md:pb-0">
        <div className="px-3 pt-3 sticky top-0 z-30 print:hidden">
          <header className="bg-[#FAF7F0]/90 backdrop-blur-xl border border-[#DED6C5] rounded-2xl px-4 sm:px-5 py-2.5 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#1B4332] text-[#FAF7F0] flex items-center justify-center font-bold text-xs shrink-0">
                <AppIcon name="tooth" />
              </div>
              <span className="text-xs font-extrabold text-[#1B4332] tracking-tight truncate">
                Yovela Dental Clinic
              </span>
              {pathname?.startsWith('/poli') && (
                <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332] text-[10px] font-bold">
                  Mode Fokus Odontogram
                </span>
              )}
            </div>

            {/* KONTROL KANAN: DARK/LIGHT MODE + NOTIFIKASI BADGE + PROFIL */}
            <div className="flex items-center gap-2">
              {/* Toggle Dark / Light Mode */}
              <button
                type="button"
                onClick={handleToggleTheme}
                aria-label={theme === 'dark' ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
                title={theme === 'dark' ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
                className="w-9 h-9 rounded-full bg-white hover:bg-[#F5F1E8] border border-[#DED6C5] text-[#1B4332] flex items-center justify-center transition cursor-pointer shadow-2xs"
              >
                <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} className="w-4 h-4" />
              </button>

              {/* Pusat Notifikasi Terintegrasi */}
              <NotificationCenter activePath={pathname || ''} />

              {/* Profil Desktop */}
              <div className="relative hidden md:block" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2.5 bg-white hover:bg-[#F5F1E8] border border-[#DED6C5] px-3 py-1.5 rounded-full transition cursor-pointer shadow-2xs"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E63946] animate-pulse" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-[#1B4332] block leading-tight">{activeUserName}</span>
                    <span className="text-[9px] text-[#2D6A4F] font-semibold block">{activeUserLabel}</span>
                  </div>
                  <AppIcon name="chevron-down" className={`text-[#52796F] text-[10px] ml-1 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#FAF7F0] border border-[#DED6C5] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-[#E8E1D3]">
                      <p className="text-xs font-bold text-[#1B4332]">{activeUserName}</p>
                      <p className="text-[10px] text-[#52796F] font-mono mt-0.5">
                        {currentUser.sipNumber ? `SIP: ${currentUser.sipNumber}` : `Role: ${currentUser.role}`}
                      </p>
                    </div>
                    {isDoctorAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => openSettings('akun')}
                          className="w-full px-4 py-2 text-left text-xs text-[#1B4332] hover:bg-[#F5F1E8] flex items-center gap-2.5 transition cursor-pointer font-semibold"
                        >
                          <AppIcon name="users-gear" className="text-[#2D6A4F] text-xs w-4" />
                          <span>Akun Staf &amp; Token</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openSettings('role')}
                          className="w-full px-4 py-2 text-left text-xs text-[#1B4332] hover:bg-[#F5F1E8] flex items-center gap-2.5 transition cursor-pointer font-semibold"
                        >
                          <AppIcon name="sliders" className="text-[#2D6A4F] text-xs w-4" />
                          <span>Atur Role &amp; Wewenang</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => openSettings('tentang')}
                      className="w-full px-4 py-2 text-left text-xs text-[#1B4332] hover:bg-[#F5F1E8] flex items-center gap-2.5 transition cursor-pointer font-semibold"
                    >
                      <AppIcon name="award" className="text-[#2D6A4F] text-xs w-4" />
                      <span>Tentang Aplikasi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleTheme();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[#1B4332] hover:bg-[#F5F1E8] flex items-center justify-between gap-2.5 transition cursor-pointer font-semibold"
                    >
                      <span className="flex items-center gap-2.5">
                        <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} className="text-[#2D6A4F] text-xs w-4" />
                        <span>Tema ({theme === 'dark' ? 'Dark' : 'Light'})</span>
                      </span>
                      <span className="text-[10px] text-[#52796F]">Ubah</span>
                    </button>
                    <div className="my-1 border-t border-[#E8E1D3]" />
                    <button
                      type="button"
                      onClick={handleFullLogout}
                      className="w-full px-4 py-2 text-left text-xs text-[#E63946] hover:bg-[#E63946]/10 flex items-center gap-2.5 transition cursor-pointer font-bold"
                    >
                      <AppIcon name="arrow-right-from-bracket" className="text-xs w-4" />
                      <span>Keluar dari Sesi (Logout)</span>
                    </button>
                  </div>
                )}
              </div>

              <span className="md:hidden px-2.5 py-1 rounded-full bg-[#1B4332] text-[#FAF7F0] text-[10px] font-bold">
                {currentUser.role}
              </span>
            </div>
          </header>
        </div>

        {isRouteAuthorized ? (
          children
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-[#FAF7F0] border border-[#DED6C5] rounded-3xl p-8 max-w-md w-full text-center shadow-sm space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E63946]/15 text-[#E63946] flex items-center justify-center text-lg">
                <AppIcon name="shield-halved" />
              </div>
              <h2 className="text-sm font-bold text-[#1B4332]">Akses Terbatas</h2>
              <p className="text-xs text-[#52796F]">
                Akun Anda (<strong>{currentUser.role}</strong>) tidak memiliki izin untuk membuka halaman ini.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] font-bold text-xs transition"
              >
                <AppIcon name="arrow-left" />
                <span>Kembali ke Dasbor Utama</span>
              </Link>
            </div>
          </div>
        )}

        <footer className="text-center text-[11px] text-[#52796F] font-medium py-6 mt-auto border-t border-[#E8E1D3] print:hidden">
          © {new Date().getFullYear()} Yovela Dental Clinic • Dikembangkan oleh <strong>Overthinker Studio</strong>
        </footer>
      </div>

      {/* MOBILE iPHONE-STYLE BOTTOM SHEET (LAINNYA & PROFIL) */}
      {mobileSheet && (
        <div
          className="fixed inset-0 z-40 bg-[#0E261C]/50 backdrop-blur-xs md:hidden print:hidden flex items-end"
          onClick={() => setMobileSheet(null)}
        >
          <div
            className="w-full bg-[#FAF7F0] rounded-t-3xl p-5 pb-28 shadow-2xl border-t border-[#DED6C5] space-y-4 max-h-[82vh] overflow-y-auto animate-in slide-in-from-bottom-6 duration-200"
            style={{ paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#DED6C5] rounded-full mx-auto" />

            {mobileSheet === 'profil' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F5F1E8] border border-[#E8E1D3]">
                  <div className="w-11 h-11 rounded-2xl bg-[#1B4332] text-[#FAF7F0] flex items-center justify-center font-bold">
                    <AppIcon name="user" className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1B4332] truncate">{activeUserName}</p>
                    <p className="text-[11px] text-[#2D6A4F] font-semibold truncate">{activeUserLabel}</p>
                    <p className="text-[10px] text-[#52796F] font-mono">
                      {currentUser.sipNumber ? `SIP: ${currentUser.sipNumber}` : `Role: ${currentUser.role}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleTheme}
                  className="w-full p-3.5 rounded-2xl bg-white hover:bg-[#F5F1E8] border border-[#DED6C5] flex items-center justify-between text-xs font-bold text-[#1B4332] cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Tema Tampilan ({theme === 'dark' ? 'Dark Forest Mode' : 'Light Oat Mode'})</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F5F1E8] border border-[#DED6C5] text-[10px]">
                    Ubah
                  </span>
                </button>

                {isDoctorAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => openSettings('akun')}
                      className="w-full p-3.5 rounded-2xl bg-white hover:bg-[#F5F1E8] border border-[#DED6C5] flex items-center justify-between text-xs font-bold text-[#1B4332] cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <AppIcon name="users-gear" className="w-4 h-4 text-[#2D6A4F]" />
                        Akun Staf &amp; Token Registrasi
                      </span>
                      <AppIcon name="arrow-right" className="w-3.5 h-3.5 text-[#52796F]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openSettings('role')}
                      className="w-full p-3.5 rounded-2xl bg-white hover:bg-[#F5F1E8] border border-[#DED6C5] flex items-center justify-between text-xs font-bold text-[#1B4332] cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <AppIcon name="sliders" className="w-4 h-4 text-[#2D6A4F]" />
                        Atur Role &amp; Wewenang
                      </span>
                      <AppIcon name="arrow-right" className="w-3.5 h-3.5 text-[#52796F]" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => openSettings('tentang')}
                  className="w-full p-3.5 rounded-2xl bg-white hover:bg-[#F5F1E8] border border-[#DED6C5] flex items-center justify-between text-xs font-bold text-[#1B4332] cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <AppIcon name="award" className="w-4 h-4 text-[#2D6A4F]" />
                    Tentang Aplikasi (Overthinker Studio)
                  </span>
                  <AppIcon name="arrow-right" className="w-3.5 h-3.5 text-[#52796F]" />
                </button>

                <button
                  type="button"
                  onClick={handleFullLogout}
                  className="w-full p-3.5 rounded-2xl bg-[#E63946]/10 hover:bg-[#E63946]/20 border border-[#E63946]/30 flex items-center justify-center gap-2 text-xs font-bold text-[#E63946] cursor-pointer"
                >
                  <AppIcon name="arrow-right-from-bracket" className="w-4 h-4" />
                  <span>Keluar dari Sesi (Logout)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1B4332]">Menu Lainnya</h3>
                    <p className="text-[11px] text-[#52796F]">Akses modul sesuai wewenang peran {currentUser.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSheet(null)}
                    className="w-8 h-8 rounded-full bg-[#F5F1E8] text-[#1B4332] flex items-center justify-center cursor-pointer"
                  >
                    <AppIcon name="xmark" className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {lainnyaItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        target={item.isExternal ? '_blank' : '_self'}
                        rel={item.isExternal ? 'noopener noreferrer' : undefined}
                        onClick={() => setMobileSheet(null)}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                          isActive
                            ? 'bg-[#1B4332] border-[#1B4332] text-[#FAF7F0] font-bold'
                            : 'bg-white border-[#DED6C5] text-[#1B4332] hover:bg-[#F5F1E8] font-semibold'
                        }`}
                      >
                        <span className="flex items-center gap-3 text-xs">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isActive ? 'bg-[#E63946] text-white' : 'bg-[#F5F1E8] text-[#1B4332]'
                          }`}>
                            <AppIcon name={item.icon} className="w-4 h-4" />
                          </span>
                          <span>{item.label}</span>
                        </span>
                        <AppIcon
                          name={item.isExternal ? 'arrow-up-right-from-square' : 'arrow-right'}
                          className="w-3.5 h-3.5 opacity-60"
                        />
                      </Link>
                    );
                  })}

                  {isDoctorAdmin && (
                    <button
                      type="button"
                      onClick={() => openSettings('akun')}
                      className="p-3.5 rounded-2xl border bg-white border-[#DED6C5] text-[#1B4332] hover:bg-[#F5F1E8] font-semibold flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-3 text-xs">
                        <span className="w-8 h-8 rounded-xl bg-[#F5F1E8] text-[#1B4332] flex items-center justify-center">
                          <AppIcon name="users-gear" className="w-4 h-4" />
                        </span>
                        <span>Pengaturan Klinik &amp; RBAC</span>
                      </span>
                      <AppIcon name="arrow-right" className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE iPHONE-STYLE FLOATING BOTTOM NAVIGATION (5 SLOT: HOME | JADWAL | PASIEN | LAINNYA | PROFIL) */}
      <nav
        aria-label="Navigasi Mobile"
        className="md:hidden print:hidden fixed bottom-3 left-3 right-3 z-50 bg-[#1B4332]/95 backdrop-blur-xl border border-[#2D6A4F] rounded-[28px] shadow-2xl px-2 py-1.5"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        <div className="grid grid-cols-5 items-center gap-1">
          <Link
            href="/dashboard"
            onClick={() => setMobileSheet(null)}
            className={`min-h-[46px] flex flex-col items-center justify-center py-1.5 rounded-2xl transition ${
              isHomeActive && !mobileSheet
                ? 'bg-[#FAF7F0] text-[#1B4332] font-extrabold shadow-sm'
                : 'text-[#B7D3C4] hover:text-white'
            }`}
          >
            <AppIcon name="house-chimney" className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 leading-none">Home</span>
          </Link>

          {canAccessJadwal ? (
            <Link
              href="/jadwal"
              onClick={() => setMobileSheet(null)}
              className={`min-h-[46px] flex flex-col items-center justify-center py-1.5 rounded-2xl transition ${
                isJadwalActive && !mobileSheet
                  ? 'bg-[#FAF7F0] text-[#1B4332] font-extrabold shadow-sm'
                  : 'text-[#B7D3C4] hover:text-white'
              }`}
            >
              <AppIcon name="calendar-check" className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 leading-none">Jadwal</span>
            </Link>
          ) : (
            <span className="min-h-[46px] flex flex-col items-center justify-center py-1.5 rounded-2xl text-[#52796F] opacity-40 cursor-not-allowed">
              <AppIcon name="calendar-check" className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 leading-none">Jadwal</span>
            </span>
          )}

          {canAccessPasien ? (
            <Link
              href="/pasien"
              onClick={() => setMobileSheet(null)}
              className={`min-h-[46px] flex flex-col items-center justify-center py-1.5 rounded-2xl transition ${
                isPasienActive && !mobileSheet
                  ? 'bg-[#FAF7F0] text-[#1B4332] font-extrabold shadow-sm'
                  : 'text-[#B7D3C4] hover:text-white'
              }`}
            >
              <AppIcon name="users" className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 leading-none">Pasien</span>
            </Link>
          ) : (
            <span className="min-h-[46px] flex flex-col items-center justify-center py-1.5 rounded-2xl text-[#52796F] opacity-40 cursor-not-allowed">
              <AppIcon name="users" className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 leading-none">Pasien</span>
            </span>
          )}

          <button
            type="button"
            disabled={!hasLainnyaAccess}
            onClick={() => setMobileSheet(mobileSheet === 'lainnya' ? null : 'lainnya')}
            className={`min-h-[46px] flex flex-col items-center justify-center py-1.5 rounded-2xl transition cursor-pointer ${
              !hasLainnyaAccess
                ? 'text-[#52796F] opacity-40 cursor-not-allowed'
                : mobileSheet === 'lainnya' || (isLainnyaRouteActive && !mobileSheet)
                ? 'bg-[#E63946] text-white font-extrabold shadow-sm'
                : 'text-[#D8E8DF] hover:text-white'
            }`}
          >
            <AppIcon name="grid" className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 leading-none">Lainnya</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileSheet(mobileSheet === 'profil' ? null : 'profil')}
            className={`min-h-[46px] flex flex-col items-center justify-center py-1.5 rounded-2xl transition cursor-pointer ${
              mobileSheet === 'profil'
                ? 'bg-[#FAF7F0] text-[#1B4332] font-extrabold shadow-sm'
                : 'text-[#B7D3C4] hover:text-white'
            }`}
          >
            <AppIcon name="user" className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 leading-none">Profil</span>
          </button>
        </div>
      </nav>

      {/* MODAL PENGATURAN: AKUN & TOKEN, ROLE & WEWENANG, TENTANG OVERTHINKER STUDIO */}
      {showSettingsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pengaturan Sistem dan Aplikasi"
          className="fixed inset-0 z-50 bg-[#0E261C]/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden"
        >
          <div className="bg-[#FAF7F0] rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-[#DED6C5] space-y-5 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b border-[#E8E1D3] pb-3">
              <div>
                <h3 className="font-extrabold text-[#1B4332] text-sm">Pengaturan Sistem &amp; Aplikasi</h3>
                <p className="text-[10px] text-[#52796F]">Kelola akun, token registrasi, wewenang role, &amp; informasi pengembang</p>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-[#52796F] hover:text-[#1B4332] cursor-pointer">
                <AppIcon name="xmark" className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-[#F5F1E8] border border-[#DED6C5]">
              {isDoctorAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setSettingsTab('akun')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition cursor-pointer ${
                      settingsTab === 'akun'
                        ? 'bg-[#1B4332] text-[#FAF7F0] shadow-xs'
                        : 'text-[#2D6A4F] hover:bg-white'
                    }`}
                  >
                    Akun &amp; Token
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab('role')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition cursor-pointer ${
                      settingsTab === 'role'
                        ? 'bg-[#1B4332] text-[#FAF7F0] shadow-xs'
                        : 'text-[#2D6A4F] hover:bg-white'
                    }`}
                  >
                    Role &amp; Wewenang
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab('whatsapp')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition cursor-pointer ${
                      settingsTab === 'whatsapp'
                        ? 'bg-[#1B4332] text-[#FAF7F0] shadow-xs'
                        : 'text-[#2D6A4F] hover:bg-white'
                    }`}
                  >
                    WhatsApp Webhook
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSettingsTab('tentang')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold transition cursor-pointer ${
                  settingsTab === 'tentang'
                    ? 'bg-[#1B4332] text-[#FAF7F0] shadow-xs'
                    : 'text-[#2D6A4F] hover:bg-white'
                }`}
              >
                Tentang Aplikasi
              </button>
            </div>

            {/* TAB 1: AKUN & TOKEN */}
            {isDoctorAdmin && settingsTab === 'akun' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#F5F1E8] border border-[#DED6C5] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-[#1B4332]">Token Registrasi Staf Baru</h4>
                      <p className="text-[10px] text-[#52796F]">Berikan token sesuai peran agar staf bisa aktivasi akun</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleGenerateToken('DOKTER')}
                        className="px-2.5 py-1 rounded-lg bg-[#1B4332] text-[#FAF7F0] font-bold text-[10px] cursor-pointer"
                      >
                        + Token Dokter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateToken('PENDAFTARAN')}
                        className="px-2.5 py-1 rounded-lg bg-[#2D6A4F] text-[#FAF7F0] font-bold text-[10px] cursor-pointer"
                      >
                        + Token Perawat
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateToken('KASIR')}
                        className="px-2.5 py-1 rounded-lg bg-[#E63946] text-white font-bold text-[10px] cursor-pointer"
                      >
                        + Token Kasir
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {regTokens.map((tk) => (
                      <div key={tk.id} className="p-2.5 rounded-xl bg-white border border-[#E8E1D3] flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-black text-[#1B4332]">{tk.code}</span>
                          <span className="ml-2 text-[10px] text-[#52796F] font-semibold">{tk.roleLabel}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#2D6A4F] font-bold">
                          Terpakai {tk.usedCount}/{tk.maxUses}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await updateStaffUsers(accountFormList);
                    if (res.success) {
                      showToast('Pengaturan akun staf berhasil disimpan ke database.', 'success');
                      setAccountFormList((prev) => prev.map((u) => ({ ...u, newPassword: '' })));
                    } else {
                      showToast(res.message || 'Gagal menyimpan pengaturan akun.', 'error');
                    }
                  }}
                  className="space-y-3"
                >
                  {accountFormList.map((acc, idx) => (
                    <div key={acc.id} className="p-3 bg-[#F5F1E8] rounded-2xl border border-[#DED6C5] space-y-2">
                      <p className="font-bold uppercase text-[11px] text-[#1B4332]">Role: {acc.role}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={acc.name}
                          onChange={(e) => {
                            const next = [...accountFormList];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setAccountFormList(next);
                          }}
                          className="p-2 border border-[#DED6C5] rounded-xl bg-white"
                          placeholder="Nama"
                        />
                        <input
                          type="text"
                          value={acc.username}
                          onChange={(e) => {
                            const next = [...accountFormList];
                            next[idx] = { ...next[idx], username: e.target.value };
                            setAccountFormList(next);
                          }}
                          className="p-2 border border-[#DED6C5] rounded-xl bg-white"
                          placeholder="Username"
                        />
                        <input
                          type="password"
                          value={acc.newPassword || ''}
                          onChange={(e) => {
                            const next = [...accountFormList];
                            next[idx] = { ...next[idx], newPassword: e.target.value };
                            setAccountFormList(next);
                          }}
                          className="p-2 border border-[#DED6C5] rounded-xl bg-white"
                          placeholder="Password baru (opsional)"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowSettingsModal(false)} className="px-4 py-2 bg-[#E8E1D3] text-[#1B4332] rounded-xl font-bold cursor-pointer">
                      Tutup
                    </button>
                    <button type="submit" className="px-5 py-2 bg-[#E63946] hover:bg-[#D62828] text-white font-bold rounded-xl cursor-pointer">
                      Simpan Akun
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: ROLE & WEWENANG */}
            {isDoctorAdmin && settingsTab === 'role' && (
              <div className="space-y-4">
                <p className="text-[11px] text-[#52796F]">
                  Atur modul yang dapat diakses oleh setiap role secara dinamis. Perubahan langsung berlaku pada menu navigasi dan hak akses halaman.
                </p>

                {(['DOKTER', 'PENDAFTARAN', 'KASIR'] as UserRole[]).map((role) => (
                  <div key={role} className="p-4 rounded-2xl bg-[#F5F1E8] border border-[#DED6C5] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-[#1B4332]">
                          {role === 'DOKTER'
                            ? 'DOKTER (Admin Klinik)'
                            : role === 'PENDAFTARAN'
                            ? 'PENDAFTARAN (Perawat / Front Office)'
                            : 'KASIR (Admin Pembayaran)'}
                        </h4>
                        <p className="text-[10px] text-[#52796F]">
                          {(rolePermissions[role] || []).length} modul aktif
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={savingRolePerm === role}
                        onClick={() => handleSaveRolePermissions(role)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] font-bold text-[11px] cursor-pointer disabled:opacity-60"
                      >
                        {savingRolePerm === role ? 'Menyimpan...' : `Simpan ${role}`}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ALL_MODULE_PERMS.map((mod) => {
                        const checked = (rolePermissions[role] || []).includes(mod.key);
                        const locked = mod.key === 'dashboard' || (role !== 'DOKTER' && mod.key === 'pengeluaran');
                        return (
                          <label
                            key={mod.key}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition ${
                              checked ? 'bg-white border-[#2D6A4F]' : 'bg-[#FAF7F0]/60 border-[#E8E1D3]'
                            } ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={locked}
                              onChange={() => handleTogglePermission(role, mod.key)}
                              className="mt-0.5 accent-[#1B4332]"
                            />
                            <div className="min-w-0">
                              <span className="block font-bold text-[#1B4332] leading-tight">{mod.label}</span>
                              <span className="block text-[10px] text-[#52796F]">{mod.desc}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: WHATSAPP WEBHOOK (FONNTE / WABLAS) */}
            {isDoctorAdmin && settingsTab === 'whatsapp' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#F5F1E8] border border-[#DED6C5] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-[#1B4332]">Notifikasi Booking WhatsApp Otomatis</h4>
                      <p className="text-[10px] text-[#52796F]">Kirim konfirmasi otomatis ke pasien &amp; admin saat booking masuk dari Landing Page</p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-[#1B4332]">
                      <input
                        type="checkbox"
                        checked={waConfig.enabled}
                        onChange={(e) => setWaConfig({ ...waConfig, enabled: e.target.checked })}
                        className="accent-[#1B4332]"
                      />
                      <span>{waConfig.enabled ? 'Aktif' : 'Nonaktif'}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#1B4332] mb-1">Gateway Provider</label>
                      <div className="flex gap-2">
                        {(['FONNTE', 'WABLAS'] as const).map((prov) => (
                          <button
                            key={prov}
                            type="button"
                            onClick={() =>
                              setWaConfig({
                                ...waConfig,
                                provider: prov,
                                endpointUrl:
                                  prov === 'WABLAS'
                                    ? 'https://pati.wablas.com/api/send-message'
                                    : 'https://api.fonnte.com/send',
                              })
                            }
                            className={`flex-1 py-2 rounded-xl font-bold border transition cursor-pointer ${
                              waConfig.provider === prov
                                ? 'bg-[#1B4332] text-[#FAF7F0] border-[#1B4332]'
                                : 'bg-white text-[#1B4332] border-[#DED6C5]'
                            }`}
                          >
                            {prov}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-[#1B4332] mb-1">Nomor WhatsApp Admin Klinik</label>
                      <input
                        type="text"
                        placeholder="0812-3456-7890"
                        value={waConfig.adminPhone}
                        onChange={(e) => setWaConfig({ ...waConfig, adminPhone: e.target.value })}
                        className="w-full p-2 border border-[#DED6C5] rounded-xl bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#1B4332] mb-1">API Token ({waConfig.provider})</label>
                      <input
                        type="text"
                        placeholder="Masukkan API Token gateway..."
                        value={waConfig.apiToken}
                        onChange={(e) => setWaConfig({ ...waConfig, apiToken: e.target.value })}
                        className="w-full p-2 border border-[#DED6C5] rounded-xl bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#1B4332] mb-1">Endpoint URL</label>
                      <input
                        type="text"
                        value={waConfig.endpointUrl}
                        onChange={(e) => setWaConfig({ ...waConfig, endpointUrl: e.target.value })}
                        className="w-full p-2 border border-[#DED6C5] rounded-xl bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="No. WA uji coba..."
                        value={waTestPhone}
                        onChange={(e) => setWaTestPhone(e.target.value)}
                        className="p-2 border border-[#DED6C5] rounded-xl bg-white font-mono w-40"
                      />
                      <button
                        type="button"
                        disabled={isTestingWa}
                        onClick={async () => {
                          setIsTestingWa(true);
                          try {
                            const res = await fetch('/api/settings/whatsapp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ testPhone: waTestPhone }),
                            });
                            const data = await res.json();
                            if (res.ok && data.result) {
                              showToast(
                                `${data.result.detail} (${data.result.mode})`,
                                data.result.sent ? 'success' : 'warning'
                              );
                            } else {
                              showToast(data.error || 'Uji kirim WA gagal.', 'error');
                            }
                          } finally {
                            setIsTestingWa(false);
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-white border border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-[#FAF7F0] font-bold cursor-pointer transition"
                      >
                        {isTestingWa ? 'Mengirim...' : 'Uji Kirim WA'}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isSavingWa}
                      onClick={async () => {
                        setIsSavingWa(true);
                        try {
                          const res = await fetch('/api/settings/whatsapp', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(waConfig),
                          });
                          if (res.ok) {
                            showToast('Konfigurasi WhatsApp Webhook disimpan.', 'success');
                            await loadWaConfig();
                          } else {
                            showToast('Gagal menyimpan konfigurasi WhatsApp.', 'error');
                          }
                        } finally {
                          setIsSavingWa(false);
                        }
                      }}
                      className="px-5 py-2 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold cursor-pointer"
                    >
                      {isSavingWa ? 'Menyimpan...' : 'Simpan Webhook'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TENTANG APLIKASI (OVERTHINKER STUDIO) */}
            {settingsTab === 'tentang' && (
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#173A2B] to-[#0E261C] text-[#FAF7F0] border border-[#2D6A4F] space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0]/15 border border-[#FAF7F0]/25 flex items-center justify-center">
                      <AppIcon name="sparkles" className="w-6 h-6 text-[#95D5B2]" />
                    </div>
                    <div>
                      <h4 className="text-base font-black tracking-tight">Yovela Dental Clinic — SIM-RME v3.3</h4>
                      <p className="text-xs text-[#95D5B2] font-bold">Dikembangkan oleh Overthinker Studio</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#D8E8DF] leading-relaxed">
                    Sistem Informasi Manajemen Klinik Gigi &amp; Rekam Medis Elektronik terintegrasi dengan
                    Odontogram Digital standar FDI, Informed Consent Tanda Tangan Digital, Antrean Display TV lintas perangkat,
                    QRIS Dinamis &amp; EDC Bridge, serta Laporan Laba Rugi Operasional.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold">
                    {['Next.js 16', 'TypeScript Strict', 'Prisma ORM', 'FDI Odontogram', 'SATUSEHAT FHIR R4', 'Overthinker Studio'].map((badge) => (
                      <span key={badge} className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-5 py-2 bg-[#1B4332] text-[#FAF7F0] font-bold rounded-xl cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
