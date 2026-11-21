'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppIcon } from '@/components/AppIcon';
import { CustomSelect } from '@/components/CustomSelect';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface InventoryMovementItem {
  id: string;
  type: 'IN' | 'OUT';
  qty: number;
  totalCost: number;
  notes: string;
  expenseId?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  stockQty: number;
  minStock: number;
  unitPrice: number;
  lastRestockAt?: string | null;
  movements?: InventoryMovementItem[];
}

const BHP_CATEGORIES = ['APD', 'Bahan Tambal', 'Anestesi', 'Sterilisasi', 'Instrumen', 'Lainnya'];
const BHP_UNITS = ['Box', 'Pcs', 'Syringe', 'Botol', 'Pack', 'Set'];

export default function StokBhpPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const isAdmin = currentUser?.role === 'DOKTER';

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Tambah Item Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('APD');
  const [newUnit, setNewUnit] = useState('Box');
  const [newStockQty, setNewStockQty] = useState('10');
  const [newMinStock, setNewMinStock] = useState('5');
  const [newUnitPrice, setNewUnitPrice] = useState('50000');

  // Modal Mutasi Stok (IN / OUT)
  const [activeMutation, setActiveMutation] = useState<{ item: InventoryItem; type: 'IN' | 'OUT' } | null>(null);
  const [mutQty, setMutQty] = useState('1');
  const [mutUnitCost, setMutUnitCost] = useState('0');
  const [mutNotes, setMutNotes] = useState('');
  const [recordAsExpense, setRecordAsExpense] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      showToast('Gagal memuat data stok BHP.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, searchQuery, categoryFilter]);

  const summary = useMemo(() => {
    const lowStock = items.filter((i) => i.stockQty <= i.minStock).length;
    const totalAsset = items.reduce((sum, i) => sum + i.stockQty * i.unitPrice, 0);
    return { total: items.length, lowStock, totalAsset };
  }, [items]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          category: newCategory,
          unit: newUnit,
          stockQty: Number(newStockQty),
          minStock: Number(newMinStock),
          unitPrice: Number(newUnitPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal menambah item BHP.', 'error');
        return;
      }
      showToast(`Item "${newName}" berhasil ditambahkan ke inventaris.`, 'success');
      setShowAddModal(false);
      setNewName('');
      await loadInventory();
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMutationModal = (item: InventoryItem, type: 'IN' | 'OUT') => {
    setActiveMutation({ item, type });
    setMutQty('1');
    setMutUnitCost(String(item.unitPrice || 0));
    setMutNotes('');
    setRecordAsExpense(type === 'IN' && isAdmin);
  };

  const handleMutationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMutation) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: activeMutation.item.id,
          type: activeMutation.type,
          qty: Number(mutQty),
          unitCost: Number(mutUnitCost),
          notes: mutNotes,
          recordAsExpense: activeMutation.type === 'IN' && isAdmin && recordAsExpense,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal memperbarui stok.', 'error');
        return;
      }
      showToast(
        activeMutation.type === 'IN'
          ? `Restock ${activeMutation.item.name} (+${mutQty}) berhasil${data.expenseRecorded ? ' & tercatat otomatis di Pengeluaran Keuangan!' : '.'}`
          : `Pemakaian ${activeMutation.item.name} (-${mutQty}) berhasil dicatat.`,
        'success'
      );
      setActiveMutation(null);
      await loadInventory();
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#1B4332] pb-12 w-full">
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* Header Bar */}
        <div className="bg-[#FAF7F0] border border-[#DED6C5] rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div>
            <h1 className="text-base font-extrabold text-[#1B4332]">Manajemen Stok BHP (Bahan Habis Pakai)</h1>
            <p className="text-[11px] text-[#52796F]">
              Pantau stok APD, komposit, anestesi, &amp; sterilisasi — restock otomatis terhubung ke Laporan Pengeluaran Admin
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition shadow-sm"
          >
            <AppIcon name="plus" className="w-3.5 h-3.5" />
            <span>Tambah Item BHP</span>
          </button>
        </div>

        {/* 3 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 items-stretch">
          <div className="bg-[#FAF7F0] rounded-3xl border border-[#E8E1D3] p-4 sm:p-5 h-full flex flex-col justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F]">Total Jenis BHP</span>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-[#1B4332]">{summary.total} Item</h3>
            <p className="text-[10px] sm:text-[11px] text-[#52796F] mt-auto">Terdaftar di gudang klinik</p>
          </div>

          <div className="bg-[#FAF7F0] rounded-3xl border border-[#E63946]/30 p-4 sm:p-5 h-full flex flex-col justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E63946]">Stok Menipis</span>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-[#E63946]">{summary.lowStock} Item</h3>
            <p className="text-[10px] sm:text-[11px] text-[#52796F] mt-auto">Muncul di notifikasi</p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-[#1B4332] text-[#FAF7F0] rounded-3xl border border-[#2D6A4F] p-4 sm:p-5 h-full flex flex-col justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#95D5B2]">Estimasi Nilai Aset BHP</span>
            <h3 className="text-xl sm:text-2xl font-black font-mono">Rp {summary.totalAsset.toLocaleString('id-ID')}</h3>
            <p className="text-[10px] sm:text-[11px] text-[#B7D3C4] mt-auto">Total nilai persediaan aktif saat ini</p>
          </div>
        </div>

        {/* Filter & Table */}
        <div className="bg-white rounded-3xl border border-[#DED6C5] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cari nama atau kode BHP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-[#DED6C5] rounded-xl pl-8 pr-3 py-2 text-xs text-[#1B4332] outline-none focus:border-[#1B4332]"
                />
                <AppIcon name="magnifying-glass" className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <div className="w-48">
                <CustomSelect
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    { value: 'ALL', label: 'Semua Kategori BHP' },
                    ...BHP_CATEGORIES.map((c) => ({ value: c, label: c })),
                  ]}
                />
              </div>
            </div>
          </div>

          {/* TAMPILAN KARTU MOBILE (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Memuat inventaris BHP...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Tidak ada item BHP yang cocok.</div>
            ) : (
              filteredItems.map((item) => {
                const isLow = item.stockQty <= item.minStock;
                return (
                  <div key={item.id} className="p-4 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] font-bold text-[#52796F]">{item.code} • {item.category}</span>
                        <h3 className="font-bold text-[#1B4332] text-sm leading-snug">{item.name}</h3>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isLow ? 'bg-[#E63946] text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isLow ? 'MENIPIS' : 'AMAN'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-[#FAF7F0] px-3 py-2 rounded-xl border border-[#E8E1D3]">
                      <span>
                        Stok: <strong className={`font-mono font-black ${isLow ? 'text-[#E63946]' : 'text-[#1B4332]'}`}>{item.stockQty} {item.unit}</strong>
                        <span className="text-slate-400 ml-1">(Min {item.minStock})</span>
                      </span>
                      <strong className="font-mono text-[#1B4332]">Rp {item.unitPrice.toLocaleString('id-ID')}</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openMutationModal(item, 'IN')}
                        className="min-h-[40px] px-3 py-2 rounded-xl bg-[#1B4332] text-[#FAF7F0] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <AppIcon name="plus" className="w-3 h-3" />
                        <span>Restock</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openMutationModal(item, 'OUT')}
                        className="min-h-[40px] px-3 py-2 rounded-xl bg-[#F5F1E8] border border-[#DED6C5] text-[#1B4332] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <AppIcon name="minus" className="w-3 h-3" />
                        <span>Pakai</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TAMPILAN TABEL DESKTOP (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Bahan / Item</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                  <th className="py-3 px-4 text-right">Harga Satuan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">Memuat inventaris BHP...</td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">Tidak ada item BHP yang cocok.</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.stockQty <= item.minStock;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#1B4332]">{item.code}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#1B4332]">{item.name}</p>
                          <p className="text-[10px] text-slate-400">Min. batas aman: {item.minStock} {item.unit}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F1E8] border border-[#DED6C5] text-[#2D6A4F]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-sm">
                          <span className={isLow ? 'text-[#E63946]' : 'text-[#1B4332]'}>
                            {item.stockQty}
                          </span>{' '}
                          <span className="text-[10px] font-semibold text-slate-400">{item.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                          Rp {item.unitPrice.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isLow ? 'bg-[#E63946] text-white' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isLow ? 'MENIPIS' : 'AMAN'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openMutationModal(item, 'IN')}
                            className="px-2.5 py-1.5 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            <AppIcon name="plus" className="w-3 h-3" />
                            <span>Restock</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openMutationModal(item, 'OUT')}
                            className="px-2.5 py-1.5 rounded-xl bg-[#F5F1E8] hover:bg-[#E63946] hover:text-white border border-[#DED6C5] text-[#1B4332] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            <AppIcon name="minus" className="w-3 h-3" />
                            <span>Pakai</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL TAMBAH ITEM BHP BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0E261C]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateItem} className="bg-[#FAF7F0] border border-[#DED6C5] rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E8E1D3] pb-3">
              <h3 className="text-sm font-extrabold text-[#1B4332]">Tambah Bahan Habis Pakai (BHP)</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="cursor-pointer text-[#52796F]">
                <AppIcon name="xmark" className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-[#1B4332] mb-1">Nama Item BHP *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Bonding Agent 3M Single Bond"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DED6C5] bg-white outline-none focus:border-[#1B4332]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Kategori</label>
                <CustomSelect value={newCategory} onChange={setNewCategory} options={BHP_CATEGORIES.map((c) => ({ value: c, label: c }))} />
              </div>
              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Satuan</label>
                <CustomSelect value={newUnit} onChange={setNewUnit} options={BHP_UNITS.map((u) => ({ value: u, label: u }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Stok Awal</label>
                <input type="number" min={0} value={newStockQty} onChange={(e) => setNewStockQty(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#DED6C5] bg-white font-mono" />
              </div>
              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Min. Aman</label>
                <input type="number" min={1} value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#DED6C5] bg-white font-mono" />
              </div>
              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Harga (Rp)</label>
                <input type="number" min={0} value={newUnitPrice} onChange={(e) => setNewUnitPrice(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#DED6C5] bg-white font-mono" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-[#E8E1D3] text-[#1B4332] font-bold cursor-pointer">
                Batal
              </button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-xl bg-[#E63946] text-white font-bold cursor-pointer disabled:opacity-60">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL RESTOCK (+) / PEMAKAIAN (-) */}
      {activeMutation && (
        <div className="fixed inset-0 z-50 bg-[#0E261C]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleMutationSubmit} className="bg-[#FAF7F0] border border-[#DED6C5] rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E8E1D3] pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#1B4332]">
                  {activeMutation.type === 'IN' ? 'Restock Bahan Masuk (+)' : 'Catat Pemakaian Poli (-)'}
                </h3>
                <p className="text-[11px] text-[#52796F]">{activeMutation.item.name} (Stok: {activeMutation.item.stockQty} {activeMutation.item.unit})</p>
              </div>
              <button type="button" onClick={() => setActiveMutation(null)} className="cursor-pointer text-[#52796F]">
                <AppIcon name="xmark" className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Jumlah ({activeMutation.item.unit}) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={mutQty}
                  onChange={(e) => setMutQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED6C5] bg-white font-mono font-bold outline-none focus:border-[#1B4332]"
                />
              </div>

              {activeMutation.type === 'IN' && (
                <div>
                  <label className="block font-bold text-[#1B4332] mb-1">Harga Beli / Satuan (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={mutUnitCost}
                    onChange={(e) => setMutUnitCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DED6C5] bg-white font-mono font-bold outline-none focus:border-[#1B4332]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-[#1B4332] mb-1">Catatan (Opsional)</label>
              <input
                type="text"
                placeholder={activeMutation.type === 'IN' ? 'Supplier / No. Nota pembelian' : 'Pemakaian tindakan harian'}
                value={mutNotes}
                onChange={(e) => setMutNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DED6C5] bg-white outline-none focus:border-[#1B4332]"
              />
            </div>

            {activeMutation.type === 'IN' && isAdmin && (
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#1B4332]/10 border border-[#1B4332]/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordAsExpense}
                  onChange={(e) => setRecordAsExpense(e.target.checked)}
                  className="mt-0.5 accent-[#1B4332]"
                />
                <div>
                  <span className="block font-bold text-[#1B4332]">Catat Otomatis ke Pengeluaran Keuangan</span>
                  <span className="block text-[10px] text-[#52796F]">
                    Total Rp {(Number(mutQty || 0) * Number(mutUnitCost || 0)).toLocaleString('id-ID')} otomatis masuk pos <strong>Pembelian Bahan &amp; BHP</strong> di Laporan Laba Rugi.
                  </span>
                </div>
              </label>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setActiveMutation(null)} className="px-4 py-2 rounded-xl bg-[#E8E1D3] text-[#1B4332] font-bold cursor-pointer">
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-xl text-white font-bold cursor-pointer disabled:opacity-60 ${
                  activeMutation.type === 'IN' ? 'bg-[#1B4332] hover:bg-[#2D6A4F]' : 'bg-[#E63946] hover:bg-[#D62828]'
                }`}
              >
                {isSubmitting ? 'Memproses...' : activeMutation.type === 'IN' ? 'Simpan Restock' : 'Kurangi Stok'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
