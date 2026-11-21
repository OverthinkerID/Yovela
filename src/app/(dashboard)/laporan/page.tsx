'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppIcon } from "@/components/AppIcon";
import { CustomSelect } from '@/components/CustomSelect';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface TransactionItem {
  id: string;
  invoiceNo: string;
  date: string;
  patientName: string;
  rmNumber: string;
  doctorName: string;
  cashierName?: string;
  treatments: string[];
  paymentMethod: 'Tunai' | 'QRIS' | 'Debit/Transfer';
  discountAmount?: number;
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  status?: 'PAID' | 'PARTIAL' | 'VOID';
}

interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  periodType: 'BULANAN' | 'TAHUNAN' | 'INSIDENTAL';
  createdBy: string;
}

const EXPENSE_CATEGORIES = [
  'Gaji Dokter',
  'Gaji Karyawan',
  'Listrik',
  'Air',
  'Pembelian Alat Medis',
  'Pembelian Bahan & BHP',
  'Sewa & Operasional',
  'Lainnya',
];

export default function LaporanKeuanganPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const isAdmin = currentUser?.role === 'DOKTER';

  const [activeTab, setActiveTab] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [printMode, setPrintMode] = useState<'mutasi' | 'pnl'>('mutasi');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<'ALL' | 'Tunai' | 'QRIS' | 'Debit/Transfer'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State Pengeluaran & Laba Rugi (Khusus Admin / DOKTER)
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [periodMode, setPeriodMode] = useState<'BULANAN' | 'TAHUNAN' | 'SEMUA'>('BULANAN');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expCategory, setExpCategory] = useState('Gaji Karyawan');
  const [expPeriodType, setExpPeriodType] = useState<'BULANAN' | 'TAHUNAN' | 'INSIDENTAL'>('BULANAN');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [isSavingExp, setIsSavingExp] = useState(false);

  // Kalkulator Gaji Dokter Berbasis Tarif Pelayanan & Potongan Bahan (Behel, dll)
  const [doctorFeeRate, setDoctorFeeRate] = useState<number>(40);
  const [selectedFeeDoctor, setSelectedFeeDoctor] = useState<string>('ALL');
  const [serviceMaterialDeductions, setServiceMaterialDeductions] = useState<Record<string, number>>({});
  const [isSavingDoctorFee, setIsSavingDoctorFee] = useState(false);

  const clinicDoctor = 'drg. Yuli Kartilla Panjaitan';
  const activeUser = currentUser?.name || 'Administrator Keuangan';

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const res = await fetch('/api/invoices', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions || []);
        }
      } catch {
        setTransactions([]);
      }
    };
    loadInvoices();
  }, []);

  const loadExpenses = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const qs =
        periodMode === 'BULANAN'
          ? `?month=${encodeURIComponent(selectedMonth)}`
          : periodMode === 'TAHUNAN'
          ? `?year=${encodeURIComponent(selectedYear)}`
          : '';
      const res = await fetch(`/api/expenses${qs}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch {
      setExpenses([]);
    }
  }, [isAdmin, periodMode, selectedMonth, selectedYear]);

  useEffect(() => {
    if (isAdmin) {
      loadExpenses();
    }
  }, [isAdmin, loadExpenses]);

  const filteredData = useMemo(() => {
    return transactions.filter((trx) => {
      const matchSearch =
        trx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trx.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trx.rmNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchMethod = filterMethod === 'ALL' || trx.paymentMethod === filterMethod;

      let matchDate = true;
      if (startDate) {
        matchDate = matchDate && trx.date.slice(0, 10) >= startDate;
      }
      if (endDate) {
        matchDate = matchDate && trx.date.slice(0, 10) <= endDate;
      }

      return matchSearch && matchMethod && matchDate;
    });
  }, [transactions, searchQuery, filterMethod, startDate, endDate]);

  const summary = useMemo(() => {
    const totalTagihan = filteredData.reduce((acc, curr) => acc + curr.amount, 0);
    const totalOmset = filteredData.reduce((acc, curr) => acc + (curr.paidAmount ?? curr.amount), 0);
    const totalPiutang = filteredData.reduce((acc, curr) => acc + (curr.remainingAmount ?? 0), 0);
    const qrisTotal = filteredData.filter((t) => t.paymentMethod === 'QRIS').reduce((a, b) => a + (b.paidAmount ?? b.amount), 0);
    const cashTotal = filteredData.filter((t) => t.paymentMethod === 'Tunai').reduce((a, b) => a + (b.paidAmount ?? b.amount), 0);
    const transferTotal = filteredData.filter((t) => t.paymentMethod === 'Debit/Transfer').reduce((a, b) => a + (b.paidAmount ?? b.amount), 0);

    return { totalTagihan, totalOmset, totalPiutang, qrisTotal, cashTotal, transferTotal, count: filteredData.length };
  }, [filteredData]);

  // Kalkulasi Laba Rugi (P&L) sesuai periode Pengeluaran (Khusus Admin)
  const pnlSummary = useMemo(() => {
    const matchedIncome = transactions
      .filter((t) => {
        if (periodMode === 'BULANAN') return t.date.startsWith(selectedMonth);
        if (periodMode === 'TAHUNAN') return t.date.startsWith(selectedYear);
        return true;
      })
      .reduce((sum, t) => sum + (t.paidAmount ?? t.amount), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = matchedIncome - totalExpenses;
    const marginPct = matchedIncome > 0 ? Math.round((netProfit / matchedIncome) * 100) : 0;

    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    }

    return { matchedIncome, totalExpenses, netProfit, marginPct, byCategory };
  }, [transactions, expenses, periodMode, selectedMonth, selectedYear]);

  const doctorFeeCalc = useMemo(() => {
    const periodTrx = transactions.filter((t) => {
      const matchPeriod =
        periodMode === 'BULANAN'
          ? t.date.startsWith(selectedMonth)
          : periodMode === 'TAHUNAN'
          ? t.date.startsWith(selectedYear)
          : true;
      const matchDoc = selectedFeeDoctor === 'ALL' || t.doctorName === selectedFeeDoctor;
      return matchPeriod && matchDoc;
    });

    const doctorList = Array.from(new Set(transactions.map((t) => t.doctorName).filter(Boolean)));
    const grossRevenue = periodTrx.reduce((sum, t) => sum + (t.paidAmount ?? t.amount), 0);

    const serviceMap = new Map<string, { name: string; count: number; isMaterialHeavy: boolean }>();
    periodTrx.forEach((t) => {
      (t.treatments || []).forEach((trtName) => {
        const existing = serviceMap.get(trtName) || {
          name: trtName,
          count: 0,
          isMaterialHeavy: /behel|ortodonti|braces|crown|tiruan|bleaching|veneer/i.test(trtName),
        };
        existing.count += 1;
        serviceMap.set(trtName, existing);
      });
    });

    const services = Array.from(serviceMap.values());
    const totalMaterialDeduction = services.reduce(
      (sum, srv) => sum + Math.max(0, serviceMaterialDeductions[srv.name] || 0),
      0
    );
    const netBase = Math.max(0, grossRevenue - totalMaterialDeduction);
    const doctorFeeAmount = Math.round((netBase * Math.max(0, Math.min(100, doctorFeeRate))) / 100);

    return {
      doctorList,
      trxCount: periodTrx.length,
      grossRevenue,
      services,
      totalMaterialDeduction,
      netBase,
      doctorFeeAmount,
    };
  }, [transactions, periodMode, selectedMonth, selectedYear, selectedFeeDoctor, serviceMaterialDeductions, doctorFeeRate]);

  const handleRecordDoctorFee = async () => {
    if (doctorFeeCalc.doctorFeeAmount <= 0) {
      showToast('Nominal gaji dokter harus lebih dari Rp 0 untuk dicatat.', 'warning');
      return;
    }
    setIsSavingDoctorFee(true);
    try {
      const docLabel = selectedFeeDoctor === 'ALL' ? clinicDoctor : selectedFeeDoctor;
      const periodLabel = periodMode === 'BULANAN' ? selectedMonth : periodMode === 'TAHUNAN' ? selectedYear : 'Semua Periode';
      const desc = `Fee ${docLabel} (${doctorFeeRate}% x Netto Rp ${doctorFeeCalc.netBase.toLocaleString('id-ID')} setelah potong bahan Rp ${doctorFeeCalc.totalMaterialDeduction.toLocaleString('id-ID')}) — ${periodLabel}`;

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: expDate,
          category: 'Gaji Dokter',
          periodType: periodMode === 'TAHUNAN' ? 'TAHUNAN' : 'BULANAN',
          description: desc,
          amount: doctorFeeCalc.doctorFeeAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal mencatat gaji dokter.', 'error');
        return;
      }
      showToast(`Gaji Dokter (Rp ${doctorFeeCalc.doctorFeeAmount.toLocaleString('id-ID')}) dicatat ke pengeluaran!`, 'success');
      await loadExpenses();
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSavingDoctorFee(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(expAmount.replace(/[^\d]/g, ''));
    if (!expDescription.trim() || numericAmount <= 0) {
      showToast('Isi keterangan pengeluaran dan nominal yang valid.', 'warning');
      return;
    }
    setIsSavingExp(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: expDate,
          category: expCategory,
          periodType: expPeriodType,
          description: expDescription.trim(),
          amount: numericAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal mencatat pengeluaran.', 'error');
        return;
      }
      showToast(`Pengeluaran "${expCategory}" berhasil dicatat!`, 'success');
      setExpDescription('');
      setExpAmount('');
      await loadExpenses();
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSavingExp(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Catatan pengeluaran dihapus.', 'info');
        await loadExpenses();
      } else {
        showToast('Gagal menghapus catatan pengeluaran.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    }
  };

  const exportCSV = () => {
    const headers = ['No Invoice', 'Tanggal & Waktu', 'Nama Pasien', 'No RM', 'Dokter', 'Tindakan', 'Metode Bayar', 'Status', 'Total Tagihan (Rp)', 'Kas Masuk (Rp)', 'Sisa Piutang (Rp)'];
    const rows = filteredData.map((t) => [
      t.invoiceNo,
      t.date,
      `"${t.patientName}"`,
      t.rmNumber,
      `"${t.doctorName}"`,
      `"${t.treatments.join('; ')}"`,
      t.paymentMethod,
      t.status === 'PARTIAL' ? 'CICILAN' : 'LUNAS',
      t.amount,
      t.paidAmount ?? t.amount,
      t.remainingAmount ?? 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_Yovela_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV Laporan Keuangan berhasil diunduh.', 'success');
  };

  const exportPnLCSV = () => {
    const periodLabel = periodMode === 'BULANAN' ? selectedMonth : periodMode === 'TAHUNAN' ? selectedYear : 'Semua_Periode';
    const lines: string[] = [
      'LAPORAN LABA RUGI (PROFIT & LOSS) — YOVELA DENTAL CLINIC',
      `Periode,${periodLabel}`,
      '',
      'RINGKASAN EKSEKUTIF,Nominal (Rp)',
      `Total Kas Masuk Aktual,${pnlSummary.matchedIncome}`,
      `Total Pengeluaran Operasional,${pnlSummary.totalExpenses}`,
      `Laba Bersih (Net Profit),${pnlSummary.netProfit}`,
      `Margin Laba Bersih (%),${pnlSummary.marginPct}%`,
      '',
      'REKAP PENGELUARAN PER KATEGORI,Subtotal (Rp)',
      ...Object.entries(pnlSummary.byCategory).map(([cat, val]) => `"${cat}",${val}`),
      '',
      'RINCIAN POS PENGELUARAN',
      'Tanggal,Kategori,Jenis Periode,Keterangan,Nominal (Rp)',
      ...expenses.map((e) => `${e.date},"${e.category}",${e.periodType},"${e.description.replace(/"/g, '""')}",${e.amount}`),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Laporan_Laba_Rugi_Yovela_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV Laporan Laba Rugi (P&L) siap akuntan berhasil diunduh.', 'success');
  };

  const handlePrintDoc = (mode: 'mutasi' | 'pnl') => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 120);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-slate-800 font-['Poppins',sans-serif] flex flex-col antialiased pb-12">
      {/* 1. SUB-BAR AKSI LAPORAN */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-3 print:hidden">
        <div className="max-w-[1440px] w-full mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900">Laporan Keuangan &amp; Laba Rugi Klinik</h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Rekapitulasi kas masuk, piutang cicilan{isAdmin ? ', pengeluaran operasional bulanan/tahunan, & laba bersih' : ', & ekspor dokumen'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
              <div className="flex bg-[#F5F1E8] p-1 rounded-xl border border-[#DED6C5] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('pemasukan')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'pemasukan'
                      ? 'bg-[#1B4332] text-[#FAF7F0] shadow-xs'
                      : 'text-[#2D6A4F] hover:bg-white'
                  }`}
                >
                  Pemasukan Kasir
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pengeluaran')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'pengeluaran'
                      ? 'bg-[#E63946] text-white shadow-xs'
                      : 'text-[#2D6A4F] hover:bg-white'
                  }`}
                >
                  <AppIcon name="trending-down" className="w-3.5 h-3.5" />
                  <span>Pengeluaran &amp; Laba (Admin)</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={exportCSV}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <AppIcon name="file-excel" className="text-emerald-600" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrintDoc(activeTab === 'pengeluaran' && isAdmin ? 'pnl' : 'mutasi')}
              className="px-4 py-1.5 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <AppIcon name="print" className="text-xs" />
              <span>{activeTab === 'pengeluaran' && isAdmin ? 'Cetak P&L (1 Lembar)' : 'Cetak PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB A: PEMASUKAN & MUTASI KASIR
         ========================================================================= */}
      {(!isAdmin || activeTab === 'pemasukan') && (
        <>
          <section className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-4 shadow-2xs print:hidden">
            <div className="max-w-[1440px] w-full mx-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-3.5 items-stretch">
                <div className="col-span-2 sm:col-span-1 h-full flex flex-col justify-between p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Kas Masuk Aktual</span>
                  <h3 className="text-xl font-black font-mono text-emerald-700 mt-1">
                    Rp {summary.totalOmset.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-emerald-600 mt-auto pt-1">{summary.count} Transaksi Terbayar</p>
                </div>

                <div className="h-full flex flex-col justify-between p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Piutang Cicilan</span>
                  <h3 className="text-xl font-black font-mono text-amber-700 mt-1">
                    Rp {summary.totalPiutang.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-amber-700 mt-auto pt-1">Sisa belum dilunasi</p>
                </div>

                <div className="h-full flex flex-col justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Metode QRIS</span>
                  <h3 className="text-lg font-bold font-mono text-slate-800 mt-1">
                    Rp {summary.qrisTotal.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-auto pt-1">Non-Tunai QRIS</p>
                </div>

                <div className="h-full flex flex-col justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Metode Tunai</span>
                  <h3 className="text-lg font-bold font-mono text-slate-800 mt-1">
                    Rp {summary.cashTotal.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-auto pt-1">Kas Fisik Kasir</p>
                </div>

                <div className="h-full flex flex-col justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Debit / Transfer</span>
                  <h3 className="text-lg font-bold font-mono text-slate-800 mt-1">
                    Rp {summary.transferTotal.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-auto pt-1">Bank / EDC</p>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Cari Pasien, Invoice, No RM..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1B4332] focus:bg-white transition"
                    />
                    <AppIcon name="magnifying-glass" className="text-slate-400 text-xs absolute left-2.5 top-2.5" />
                  </div>

                  <div className="w-48">
                    <CustomSelect
                      value={filterMethod}
                      onChange={(val) => setFilterMethod(val as 'ALL' | 'Tunai' | 'QRIS' | 'Debit/Transfer')}
                      options={[
                        { value: 'ALL', label: 'Semua Pembayaran' },
                        { value: 'QRIS', label: 'QRIS / EDC' },
                        { value: 'Tunai', label: 'Tunai (Cash)' },
                        { value: 'Debit/Transfer', label: 'Debit / Transfer' },
                      ]}
                    />
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 outline-none focus:border-[#1B4332]"
                    />
                    <span>s/d</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                {(startDate || endDate || searchQuery || filterMethod !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setSearchQuery('');
                      setFilterMethod('ALL');
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>
          </section>

          <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 flex-1 print:hidden">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Transaksi Keuangan ({filteredData.length} Data)
                </h2>
                <span className="text-[11px] text-slate-400">Menampilkan mutasi kasir yang sah</span>
              </div>

              {/* TAMPILAN KARTU MOBILE (< md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredData.length === 0 ? (
                  <div className="text-center py-10 px-4 text-slate-400 text-xs">
                    Tidak ditemukan transaksi dalam periode atau filter yang dipilih.
                  </div>
                ) : (
                  filteredData.map((trx) => {
                    const paid = trx.paidAmount ?? trx.amount;
                    const rem = trx.remainingAmount ?? 0;
                    const isPartial = trx.status === 'PARTIAL' || rem > 0;
                    return (
                      <div key={trx.id} className="p-4 space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-[#1B4332] block">{trx.invoiceNo}</span>
                            <p className="font-bold text-slate-800 truncate">{trx.patientName} <span className="font-mono font-normal text-slate-400">({trx.rmNumber})</span></p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                            isPartial ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isPartial ? 'CICILAN' : 'LUNAS'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{trx.treatments.join(', ')}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-mono text-slate-400">{trx.date} • {trx.paymentMethod}</span>
                          <div className="text-right font-mono">
                            <strong className="text-slate-900">Rp {paid.toLocaleString('id-ID')}</strong>
                            {rem > 0 && <span className="block text-[10px] text-amber-700">Sisa: Rp {rem.toLocaleString('id-ID')}</span>}
                          </div>
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
                      <th className="py-3 px-4">No. Invoice</th>
                      <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                      <th className="py-3 px-4">Pasien</th>
                      <th className="py-3 px-4">No. RM</th>
                      <th className="py-3 px-4">Tindakan Klinis</th>
                      <th className="py-3 px-4">Metode &amp; Status</th>
                      <th className="py-3 px-4 text-right">Kas Masuk / Tagihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                          Tidak ditemukan transaksi dalam periode atau filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((trx) => {
                        const paid = trx.paidAmount ?? trx.amount;
                        const rem = trx.remainingAmount ?? 0;
                        const isPartial = trx.status === 'PARTIAL' || rem > 0;
                        return (
                          <tr key={trx.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-mono font-bold text-[#1B4332]">{trx.invoiceNo}</td>
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{trx.date}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{trx.patientName}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">{trx.rmNumber}</td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{trx.treatments.join(', ')}</td>
                            <td className="py-3 px-4 space-x-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1B4332]/10 text-[#1B4332]">
                                {trx.paymentMethod}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                isPartial ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {isPartial ? 'CICILAN' : 'LUNAS'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              <div className="font-bold text-slate-900">Rp {paid.toLocaleString('id-ID')}</div>
                              {rem > 0 && (
                                <div className="text-[10px] text-amber-700 font-semibold">
                                  Sisa: Rp {rem.toLocaleString('id-ID')}
                                </div>
                              )}
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
        </>
      )}

      {/* =========================================================================
          TAB B: PENGELUARAN OPERASIONAL BULANAN/TAHUNAN & LABA BERSIH (KHUSUS ADMIN)
         ========================================================================= */}
      {isAdmin && activeTab === 'pengeluaran' && (
        <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 flex-1 print:hidden">
          {/* Filter Periode Bulanan / Tahunan */}
          <div className="bg-white rounded-3xl border border-[#DED6C5] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-[#1B4332]">Periode Laporan Laba Rugi:</span>
              <div className="w-40">
                <CustomSelect
                  value={periodMode}
                  onChange={(val) => setPeriodMode(val as 'BULANAN' | 'TAHUNAN' | 'SEMUA')}
                  options={[
                    { value: 'BULANAN', label: 'Per Bulan' },
                    { value: 'TAHUNAN', label: 'Per Tahun' },
                    { value: 'SEMUA', label: 'Semua Periode' },
                  ]}
                />
              </div>

              {periodMode === 'BULANAN' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-50 border border-[#DED6C5] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#1B4332] outline-none focus:border-[#1B4332]"
                />
              )}

              {periodMode === 'TAHUNAN' && (
                <div className="w-32">
                  <CustomSelect
                    value={selectedYear}
                    onChange={setSelectedYear}
                    options={[
                      { value: '2026', label: 'Tahun 2026' },
                      { value: '2025', label: 'Tahun 2025' },
                      { value: '2024', label: 'Tahun 2024' },
                    ]}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportPnLCSV}
                className="px-3 py-1.5 rounded-xl border border-[#1B4332]/25 bg-[#F5F1E8] hover:bg-[#1B4332] hover:text-[#FAF7F0] text-[#1B4332] text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <AppIcon name="file-excel" className="w-3.5 h-3.5" />
                <span>Ekspor CSV Laba Rugi (P&amp;L)</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrintDoc('pnl')}
                className="px-3 py-1.5 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <AppIcon name="print" className="w-3.5 h-3.5" />
                <span>Cetak Laporan P&amp;L PDF</span>
              </button>
            </div>
          </div>

          {/* 3 KPI EKSEKUTIF P&L */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            <div className="h-full flex flex-col justify-between p-5 rounded-3xl bg-white border border-emerald-200 shadow-xs gap-2">
              <span className="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider">
                Kas Masuk Aktual ({periodMode === 'BULANAN' ? selectedMonth : periodMode === 'TAHUNAN' ? selectedYear : 'Semua'})
              </span>
              <h3 className="text-2xl font-black font-mono text-[#1B4332]">
                Rp {pnlSummary.matchedIncome.toLocaleString('id-ID')}
              </h3>
              <p className="text-[11px] text-slate-500 mt-auto">Total pembayaran pasien diterima kasir</p>
            </div>

            <div className="h-full flex flex-col justify-between p-5 rounded-3xl bg-white border border-rose-200 shadow-xs gap-2">
              <span className="text-[10px] uppercase font-extrabold text-[#E63946] tracking-wider">
                Total Pengeluaran Operasional
              </span>
              <h3 className="text-2xl font-black font-mono text-[#E63946]">
                Rp {pnlSummary.totalExpenses.toLocaleString('id-ID')}
              </h3>
              <p className="text-[11px] text-slate-500 mt-auto">{expenses.length} pos biaya tercatat (gaji, utilitas, bahan/alat)</p>
            </div>

            <div className="h-full flex flex-col justify-between p-5 rounded-3xl bg-[#1B4332] text-[#FAF7F0] border border-[#2D6A4F] shadow-md gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-[#95D5B2] tracking-wider">
                  Laba Bersih (Net Profit)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  pnlSummary.netProfit >= 0 ? 'bg-[#40916C] text-white' : 'bg-[#E63946] text-white'
                }`}>
                  Margin {pnlSummary.marginPct}%
                </span>
              </div>
              <h3 className="text-2xl font-black font-mono">
                Rp {pnlSummary.netProfit.toLocaleString('id-ID')}
              </h3>
              <p className="text-[11px] text-[#B7D3C4] mt-auto">Kas Masuk dikurangi Pengeluaran Operasional</p>
            </div>
          </div>

          {/* KALKULATOR GAJI DOKTER BERBASIS TARIF PELAYANAN & POTONGAN BAHAN (BEHEL, DLL) */}
          <div className="bg-white rounded-3xl border border-[#DED6C5] p-5 sm:p-6 space-y-4 shadow-xs text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#1B4332]">Sistem Tarif Gaji Dokter (Bagi Hasil Pelayanan Gigi)</h2>
                <p className="text-[11px] text-[#52796F]">
                  Hitung otomatis fee dokter dari pendapatan pelayanan gigi dikurangi biaya bahan (mis. Behel / Ortodonti / Lab)
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#1B4332]/10 text-[#1B4332] font-mono text-[10px] font-bold">
                {doctorFeeCalc.trxCount} Transaksi Periode Ini
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Dokter Pemeriksa</label>
                <CustomSelect
                  value={selectedFeeDoctor}
                  onChange={setSelectedFeeDoctor}
                  options={[
                    { value: 'ALL', label: 'Semua Dokter / Klinik' },
                    ...doctorFeeCalc.doctorList.map((d) => ({ value: d, label: d })),
                  ]}
                />
              </div>
              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Persentase Tarif Dokter (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={doctorFeeRate}
                  onChange={(e) => setDoctorFeeRate(Number(e.target.value || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED6C5] bg-slate-50 font-mono font-bold text-[#1B4332] outline-none focus:border-[#1B4332]"
                />
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#DED6C5] flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-[#52796F]">Estimasi Gaji Dokter ({doctorFeeRate}%)</span>
                <strong className="text-lg font-black font-mono text-[#E63946]">
                  Rp {doctorFeeCalc.doctorFeeAmount.toLocaleString('id-ID')}
                </strong>
              </div>
            </div>

            {doctorFeeCalc.services.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] block">
                  Potongan Biaya Bahan / Lab per Pelayanan (Isi Rp 0 jika tanpa potongan bahan):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {doctorFeeCalc.services.map((srv) => (
                    <div
                      key={srv.name}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                        srv.isMaterialHeavy ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#1B4332] truncate">{srv.name}</p>
                        <p className="text-[10px] text-[#52796F]">
                          {srv.count}x tindakan {srv.isMaterialHeavy ? '• Perlu potong bahan/alat' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">-Rp</span>
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={serviceMaterialDeductions[srv.name] || ''}
                          onChange={(e) =>
                            setServiceMaterialDeductions((prev) => ({
                              ...prev,
                              [srv.name]: Number(e.target.value || 0),
                            }))
                          }
                          className="w-28 px-2 py-1 rounded-lg border border-[#DED6C5] bg-white font-mono font-bold text-right text-[#1B4332]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-4 text-[11px]">
                <span>Pendapatan Kotor: <strong className="font-mono text-[#1B4332]">Rp {doctorFeeCalc.grossRevenue.toLocaleString('id-ID')}</strong></span>
                <span>Potong Bahan: <strong className="font-mono text-[#E63946]">-Rp {doctorFeeCalc.totalMaterialDeduction.toLocaleString('id-ID')}</strong></span>
                <span>Dasar Netto: <strong className="font-mono text-[#1B4332]">Rp {doctorFeeCalc.netBase.toLocaleString('id-ID')}</strong></span>
              </div>
              <button
                type="button"
                disabled={isSavingDoctorFee || doctorFeeCalc.doctorFeeAmount <= 0}
                onClick={handleRecordDoctorFee}
                className="px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FAF7F0] font-bold text-xs cursor-pointer transition disabled:opacity-50"
              >
                {isSavingDoctorFee ? 'Mencatat...' : 'Catat Gaji Dokter ke Pengeluaran'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Input Pengeluaran */}
            <form onSubmit={handleAddExpense} className="lg:col-span-4 bg-white rounded-3xl border border-[#DED6C5] p-5 space-y-3.5 text-xs h-fit shadow-xs">
              <div className="border-b border-slate-100 pb-2.5">
                <h2 className="text-sm font-extrabold text-[#1B4332]">Catat Pengeluaran Baru</h2>
                <p className="text-[10px] text-slate-400">Gaji karyawan, listrik, air, alat medis, bahan/BHP</p>
              </div>

              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Tanggal Transaksi</label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED6C5] bg-slate-50 font-mono text-[#1B4332] outline-none focus:border-[#1B4332]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Kategori Biaya</label>
                <CustomSelect
                  value={expCategory}
                  onChange={setExpCategory}
                  options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              </div>

              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Jenis Periode</label>
                <CustomSelect
                  value={expPeriodType}
                  onChange={(v) => setExpPeriodType(v as 'BULANAN' | 'TAHUNAN' | 'INSIDENTAL')}
                  options={[
                    { value: 'BULANAN', label: 'Rutin Bulanan' },
                    { value: 'TAHUNAN', label: 'Rutin Tahunan' },
                    { value: 'INSIDENTAL', label: 'Insidental / Pengadaan' },
                  ]}
                />
              </div>

              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  placeholder="Contoh: 2500000"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED6C5] bg-slate-50 font-mono font-bold text-[#1B4332] outline-none focus:border-[#1B4332]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Keterangan Detail</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Gaji perawat bulan November / Restock komposit 3M"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DED6C5] bg-slate-50 text-[#1B4332] outline-none focus:border-[#1B4332]"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingExp}
                className="w-full py-2.5 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold shadow-sm transition cursor-pointer disabled:opacity-60"
              >
                {isSavingExp ? 'Menyimpan...' : 'Simpan Pengeluaran'}
              </button>
            </form>

            {/* Daftar Pengeluaran & Ringkasan Kategori */}
            <div className="lg:col-span-8 space-y-4">
              {Object.keys(pnlSummary.byCategory).length > 0 && (
                <div className="bg-white rounded-3xl border border-[#DED6C5] p-4 flex flex-wrap gap-2">
                  {Object.entries(pnlSummary.byCategory).map(([cat, total]) => (
                    <div key={cat} className="px-3 py-1.5 rounded-xl bg-[#F5F1E8] border border-[#E8E1D3] text-[11px]">
                      <span className="font-semibold text-[#52796F]">{cat}: </span>
                      <strong className="font-mono text-[#1B4332]">Rp {total.toLocaleString('id-ID')}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white rounded-3xl border border-[#DED6C5] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
                    Rincian Pengeluaran Klinik ({expenses.length} Catatan)
                  </h2>
                </div>
                {/* TAMPILAN KARTU MOBILE (< md) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <div className="text-center py-8 px-4 text-slate-400 text-xs">
                      Belum ada catatan pengeluaran pada periode ini.
                    </div>
                  ) : (
                    expenses.map((item) => (
                      <div key={item.id} className="p-4 space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-[#1B4332] block">{item.category}</span>
                            <span className="font-mono text-[10px] text-slate-400">{item.date} • {item.periodType}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(item.id)}
                            title="Hapus pengeluaran"
                            className="p-2 rounded-lg text-slate-400 hover:text-[#E63946] hover:bg-rose-50 cursor-pointer transition shrink-0"
                          >
                            <AppIcon name="trash" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-600 text-[11px]">{item.description}</p>
                        <div className="text-right font-mono font-bold text-[#E63946]">
                          Rp {item.amount.toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* TAMPILAN TABEL DESKTOP (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4">Keterangan</th>
                        <th className="py-3 px-4">Periode</th>
                        <th className="py-3 px-4 text-right">Nominal</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400">
                            Belum ada catatan pengeluaran pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        expenses.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{item.date}</td>
                            <td className="py-3 px-4 font-bold text-[#1B4332]">{item.category}</td>
                            <td className="py-3 px-4 text-slate-600">{item.description}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#1B4332]/10 text-[#1B4332]">
                                {item.periodType}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[#E63946]">
                              Rp {item.amount.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(item.id)}
                                title="Hapus pengeluaran"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#E63946] hover:bg-rose-50 cursor-pointer transition"
                              >
                                <AppIcon name="trash" className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* =========================================================================
          4. DOKUMEN CETAK LAPORAN KEUANGAN RESMI (HANYA AKTIF SAAT WINDOW.PRINT)
         ========================================================================= */}
      <section className="hidden print:block fixed inset-0 m-0 p-8 bg-white text-black font-sans text-xs z-[99999]">
        <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-black">Yovela Dental Clinic</h1>
            <p className="text-xs text-gray-700">Instalasi Pelayanan Medis Gigi &amp; Bedah Mulut Modern</p>
            <p className="text-[11px] text-gray-600">Jl. Pemuda No. 45, Semarang • Telp: (024) 8765-4321</p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold uppercase tracking-wide">
              {printMode === 'pnl' ? 'Laporan Laba Rugi (Profit & Loss Statement)' : 'Laporan Keuangan & Mutasi Kasir'}
            </h2>
            <p className="text-[11px] text-gray-600">
              Periode:{' '}
              {printMode === 'pnl'
                ? periodMode === 'BULANAN'
                  ? `Bulan ${selectedMonth}`
                  : periodMode === 'TAHUNAN'
                  ? `Tahun ${selectedYear}`
                  : 'Semua Periode'
                : `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`}
            </p>
            <p className="text-[10px] text-gray-500">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
          </div>
        </div>

        {printMode === 'pnl' && isAdmin ? (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-3 gap-3 p-3 border border-black rounded text-[11px]">
              <div>
                <span className="block text-gray-600 uppercase text-[9px]">Total Pendapatan (Kas Masuk)</span>
                <strong className="text-sm font-mono">Rp {pnlSummary.matchedIncome.toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span className="block text-gray-600 uppercase text-[9px]">Total Beban Operasional</span>
                <strong className="text-sm font-mono">Rp {pnlSummary.totalExpenses.toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span className="block text-gray-600 uppercase text-[9px]">Laba Bersih (Margin {pnlSummary.marginPct}%)</span>
                <strong className="text-sm font-mono">Rp {pnlSummary.netProfit.toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-gray-100 border-b border-black text-left">
                  <th className="border border-black p-1.5">Pos Kategori Pengeluaran</th>
                  <th className="border border-black p-1.5 text-right">Subtotal (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(pnlSummary.byCategory).length === 0 ? (
                  <tr><td colSpan={2} className="border border-black p-2 text-center">Tidak ada pengeluaran pada periode ini.</td></tr>
                ) : (
                  Object.entries(pnlSummary.byCategory).map(([cat, total]) => (
                    <tr key={cat}>
                      <td className="border border-black p-1.5 font-semibold">{cat}</td>
                      <td className="border border-black p-1.5 text-right font-mono">Rp {total.toLocaleString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-black p-2 text-right uppercase">LABA BERSIH PERIODE INI:</td>
                  <td className="border border-black p-2 text-right font-mono">Rp {pnlSummary.netProfit.toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-3 mb-4 p-3 border border-black rounded text-[11px]">
          <div>
            <span className="block text-gray-600 uppercase text-[9px]">Total Omset</span>
            <strong className="text-sm font-mono">Rp {summary.totalOmset.toLocaleString('id-ID')}</strong>
          </div>
          <div>
            <span className="block text-gray-600 uppercase text-[9px]">QRIS</span>
            <strong className="text-sm font-mono">Rp {summary.qrisTotal.toLocaleString('id-ID')}</strong>
          </div>
          <div>
            <span className="block text-gray-600 uppercase text-[9px]">Tunai (Cash)</span>
            <strong className="text-sm font-mono">Rp {summary.cashTotal.toLocaleString('id-ID')}</strong>
          </div>
          <div>
            <span className="block text-gray-600 uppercase text-[9px]">Debit/Transfer</span>
            <strong className="text-sm font-mono">Rp {summary.transferTotal.toLocaleString('id-ID')}</strong>
          </div>
        </div>

        {isAdmin && expenses.length > 0 && (
          <div className="mb-4 p-3 border border-black rounded text-[11px] flex justify-between">
            <div>
              <span className="block text-gray-600 uppercase text-[9px]">Pengeluaran Operasional ({periodMode})</span>
              <strong className="text-sm font-mono">Rp {pnlSummary.totalExpenses.toLocaleString('id-ID')}</strong>
            </div>
            <div className="text-right">
              <span className="block text-gray-600 uppercase text-[9px]">Laba Bersih (Net Profit)</span>
              <strong className="text-sm font-mono">Rp {pnlSummary.netProfit.toLocaleString('id-ID')}</strong>
            </div>
          </div>
        )}

        <table className="w-full border-collapse border border-black text-[10px] mb-6">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-left">
              <th className="border border-black p-1.5 w-8 text-center">No</th>
              <th className="border border-black p-1.5">No Invoice</th>
              <th className="border border-black p-1.5">Waktu</th>
              <th className="border border-black p-1.5">Pasien</th>
              <th className="border border-black p-1.5">No RM</th>
              <th className="border border-black p-1.5">Tindakan</th>
              <th className="border border-black p-1.5">Metode</th>
              <th className="border border-black p-1.5 text-right">Kas Masuk (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((trx, idx) => (
              <tr key={trx.id} className="border-b border-gray-300">
                <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                <td className="border border-black p-1.5 font-mono">{trx.invoiceNo}</td>
                <td className="border border-black p-1.5 font-mono">{trx.date}</td>
                <td className="border border-black p-1.5 font-semibold">{trx.patientName}</td>
                <td className="border border-black p-1.5 font-mono">{trx.rmNumber}</td>
                <td className="border border-black p-1.5">{trx.treatments.join(', ')}</td>
                <td className="border border-black p-1.5">{trx.paymentMethod}</td>
                <td className="border border-black p-1.5 text-right font-mono font-bold">
                  Rp {(trx.paidAmount ?? trx.amount).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-100 border-t-2 border-black">
              <td colSpan={7} className="border border-black p-2 text-right uppercase">
                TOTAL KAS MASUK ({filteredData.length} TRANSAKSI):
              </td>
              <td className="border border-black p-2 text-right font-mono text-xs">
                Rp {summary.totalOmset.toLocaleString('id-ID')}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="flex justify-between items-start pt-6 text-[11px] break-inside-avoid">
          <div className="text-center w-52">
            <p className="mb-14">Petugas Kasir / Keuangan,</p>
            <p className="font-bold underline">{activeUser}</p>
            <p className="text-[10px] text-gray-500">Staf Administrasi Klinik</p>
          </div>

          <div className="text-center w-52">
            <p className="mb-14">Penanggung Jawab Medis,</p>
            <p className="font-bold underline">{clinicDoctor}</p>
            <p className="text-[10px] text-gray-500">SIP: 503/449/DRG/2026</p>
          </div>
        </div>
      </section>
    </div>
  );
}
