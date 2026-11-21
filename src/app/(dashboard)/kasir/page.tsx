'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppIcon } from "@/components/AppIcon";
import { PatientRecord } from '../../../data/patientDatabase';
import { TREATMENTS, Treatment } from '../../../data/mockData';
import { InvoiceReceipt, InvoiceData } from '../../../components/InvoiceReceipt';
import { CustomSelect } from '../../../components/CustomSelect';
import { QrisEdcPanel } from '../../../components/QrisEdcPanel';
import { useAuth } from '../../../context/AuthContext';

interface PaymentRecord {
  id: string;
  amount: number;
  paymentMethod: 'Tunai' | 'QRIS' | 'Debit/Transfer';
  cashGiven?: number;
  change?: number;
  note?: string;
  cashierName: string;
  paidAt: string;
}

interface TransactionItem {
  id: string;
  invoiceNo: string;
  encounterId?: string;
  date: string;
  patientName: string;
  rmNumber: string;
  doctorName: string;
  cashierName: string;
  treatments: string[];
  paymentMethod: 'Tunai' | 'QRIS' | 'Debit/Transfer';
  subtotal: number;
  discountAmount: number;
  discountNote?: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  cashGiven?: number;
  change?: number;
  status: 'PAID' | 'PARTIAL' | 'VOID';
  payments?: PaymentRecord[];
}

export default function KasirBillingPage() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [treatmentCatalog, setTreatmentCatalog] = useState<Treatment[]>(TREATMENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'billing' | 'riwayat'>('billing');
  const [toastMessage, setToastMessage] = useState('');

  // Form Pembayaran, Diskon & Cicilan
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Debit/Transfer'>('QRIS');
  const [discountType, setDiscountType] = useState<'nominal' | 'percent'>('nominal');
  const [discountInput, setDiscountInput] = useState<number | ''>('');
  const [discountNote, setDiscountNote] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [paidNowInput, setPaidNowInput] = useState<number | ''>('');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [completedInvoice, setCompletedInvoice] = useState<InvoiceData | null>(null);

  // Modal Pelunasan / Bayar Cicilan Lanjutan
  const [installmentTarget, setInstallmentTarget] = useState<TransactionItem | null>(null);
  const [installmentPayAmount, setInstallmentPayAmount] = useState<number | ''>('');
  const [installmentMethod, setInstallmentMethod] = useState<'Tunai' | 'QRIS' | 'Debit/Transfer'>('QRIS');
  const [installmentNote, setInstallmentNote] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const refreshKasirData = async () => {
    try {
      const [pRes, iRes, tRes] = await Promise.all([
        fetch('/api/patients', { cache: 'no-store' }),
        fetch('/api/invoices', { cache: 'no-store' }),
        fetch('/api/treatments', { cache: 'no-store' }),
      ]);
      if (tRes.ok) {
        const tData = await tRes.json();
        if (Array.isArray(tData.treatments) && tData.treatments.length > 0) {
          setTreatmentCatalog(tData.treatments);
        }
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        const list: PatientRecord[] = pData.patients || [];
        setPatients(list);
        setSelectedPatientId((prev) => {
          if (prev && list.some((p) => p.id === prev)) return prev;
          const savedActive =
            typeof window !== 'undefined' ? localStorage.getItem('yovela_active_patient_id') : null;
          const fromActive = list.find(
            (p) => p.id === savedActive && p.statusKunjungan === 'Menunggu Pembayaran'
          );
          if (fromActive) return fromActive.id;
          const pendingPatient = list.find((p) => p.statusKunjungan === 'Menunggu Pembayaran');
          return pendingPatient?.id || list[0]?.id || '';
        });
      }
      if (iRes.ok) {
        const iData = await iRes.json();
        setTransactions(iData.transactions || []);
      }
    } catch (err) {
      console.error('Gagal memuat data kasir:', err);
    }
  };

  useEffect(() => {
    refreshKasirData();
  }, []);

  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  const patientTreatments = useMemo<Treatment[]>(() => {
    if (!activePatient || !activePatient.lastSoap?.suggestedTreatments) {
      return [treatmentCatalog[0] || TREATMENTS[0]];
    }
    const matched = treatmentCatalog.filter((t) =>
      activePatient.lastSoap?.suggestedTreatments?.includes(t.id)
    );
    return matched.length > 0 ? matched : [treatmentCatalog[0] || TREATMENTS[0]];
  }, [activePatient, treatmentCatalog]);

  const subtotalAmount = useMemo(() => {
    return patientTreatments.reduce((acc, curr) => acc + curr.price, 0);
  }, [patientTreatments]);

  const discountAmount = useMemo(() => {
    const val = typeof discountInput === 'number' ? Math.max(0, discountInput) : 0;
    if (discountType === 'percent') {
      const pct = Math.min(100, val);
      return Math.round((subtotalAmount * pct) / 100);
    }
    return Math.min(subtotalAmount, Math.round(val));
  }, [discountInput, discountType, subtotalAmount]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotalAmount - discountAmount);
  }, [subtotalAmount, discountAmount]);

  const amountDueNow = useMemo(() => {
    if (!isInstallment) return totalAmount;
    const val = typeof paidNowInput === 'number' ? Math.max(0, paidNowInput) : 0;
    return Math.min(totalAmount, Math.round(val));
  }, [isInstallment, paidNowInput, totalAmount]);

  const remainingAfterPay = useMemo(() => {
    return Math.max(0, totalAmount - amountDueNow);
  }, [totalAmount, amountDueNow]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'Tunai' || typeof cashGiven !== 'number') return 0;
    return cashGiven - amountDueNow >= 0 ? cashGiven - amountDueNow : 0;
  }, [paymentMethod, cashGiven, amountDueNow]);

  const pendingPatients = useMemo(() => {
    return patients.filter((p) => p.statusKunjungan === 'Menunggu Pembayaran');
  }, [patients]);

  const partialCount = useMemo(() => {
    return transactions.filter((t) => t.status === 'PARTIAL' && t.remainingAmount > 0).length;
  }, [transactions]);

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient?.encounterId) return;

    if (isInstallment && amountDueNow <= 0) {
      showToast('Masukkan nominal DP / cicilan pertama yang valid!');
      return;
    }

    if (paymentMethod === 'Tunai' && (typeof cashGiven !== 'number' || cashGiven < amountDueNow)) {
      showToast('Nominal uang tunai kurang dari jumlah yang dibayar sekarang!');
      return;
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounterId: activePatient.encounterId,
          paymentMethod,
          discountAmount,
          discountNote: discountNote.trim() || undefined,
          isInstallment,
          paidNow: amountDueNow,
          cashGiven: paymentMethod === 'Tunai' && typeof cashGiven === 'number' ? cashGiven : amountDueNow,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal memproses pembayaran.');
        return;
      }

      const trx: TransactionItem = data.transaction;
      setCompletedInvoice({
        invoiceNo: trx.invoiceNo,
        patientName: trx.patientName,
        rmNumber: trx.rmNumber,
        doctorName: trx.doctorName,
        treatments: patientTreatments,
        subtotal: trx.subtotal,
        discountAmount: trx.discountAmount,
        discountNote: trx.discountNote,
        total: trx.amount,
        paidAmount: trx.paidAmount,
        remainingAmount: trx.remainingAmount,
        status: trx.status,
        paymentMethod: trx.paymentMethod,
        cashGiven: trx.cashGiven,
        change: trx.change,
      });

      showToast(
        trx.status === 'PARTIAL'
          ? `DP / Cicilan ${trx.invoiceNo} berhasil dicatat! Sisa tagihan Rp ${trx.remainingAmount.toLocaleString('id-ID')}.`
          : `Pembayaran ${trx.invoiceNo} lunas & tersimpan ke database!`
      );
      await refreshKasirData();
    } catch {
      showToast('Gagal terhubung ke server database.');
    }
  };

  const handleAddInstallmentPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installmentTarget) return;
    const payAmt = typeof installmentPayAmount === 'number' ? installmentPayAmount : 0;
    if (payAmt <= 0) {
      showToast('Nominal cicilan harus lebih besar dari Rp 0.');
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${installmentTarget.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payAmt,
          paymentMethod: installmentMethod,
          note: installmentNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal mencatat pembayaran cicilan.');
        return;
      }

      setInstallmentTarget(null);
      setInstallmentPayAmount('');
      setInstallmentNote('');
      showToast(
        data.invoice.status === 'PAID'
          ? `Tagihan ${data.invoice.invoiceNo} kini LUNAS!`
          : `Cicilan tercatat! Sisa tagihan Rp ${data.invoice.remainingAmount.toLocaleString('id-ID')}.`
      );
      await refreshKasirData();
    } catch {
      showToast('Gagal terhubung ke server database.');
    }
  };

  const totalReceivedToday = useMemo(
    () => transactions.reduce((sum, t) => sum + (t.paidAmount || t.amount || 0), 0),
    [transactions]
  );

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-slate-800 font-['Poppins',sans-serif] flex flex-col antialiased pb-12 w-full">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs font-semibold">
          <div className="w-6 h-6 rounded-full bg-[#1B4332] text-[#FAF7F0] flex items-center justify-center text-xs">
            <AppIcon name="receipt" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SUB-BANNER TABS & STATISTIK KASIR */}
      <section className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-3.5 shadow-2xs print:hidden">
        <div className="max-w-[1440px] w-full mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-[#1B4332] text-[#FAF7F0] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AppIcon name="cash-register" className="text-xs" />
              <span>Loket Pembayaran Pasien</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('riwayat')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'riwayat'
                  ? 'bg-[#1B4332] text-[#FAF7F0] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AppIcon name="receipt" className="text-xs" />
              <span>Riwayat & Cicilan ({transactions.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {partialCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-900 font-semibold text-[11px]">
                  Cicilan Berjalan: <strong>{partialCount}</strong>
                </span>
              </div>
            )}
            <div className="bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1B4332]" />
              <span className="text-emerald-900 font-semibold text-[11px]">
                Kas Masuk: <strong className="font-mono text-emerald-700">Rp {totalReceivedToday.toLocaleString('id-ID')}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* KONTEN UTAMA */}
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 flex-1 print:hidden">
        {activeTab === 'billing' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* KOLOM KIRI (7 Kolom) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#1B4332]/10 text-[#2D6A4F] flex items-center justify-center text-xs">
                      <AppIcon name="user-tag" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Pilih Pasien di Antrean Kasir</h3>
                      <p className="text-[10px] text-slate-400">Pasien yang telah selesai diperiksa oleh dokter gigi</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {pendingPatients.length} Menunggu Pembayaran
                  </span>
                </div>

                <CustomSelect
                  searchable
                  value={selectedPatientId}
                  onChange={(val) => {
                    setSelectedPatientId(val);
                    setCompletedInvoice(null);
                    setCashGiven('');
                    setDiscountInput('');
                    setDiscountNote('');
                    setIsInstallment(false);
                    setPaidNowInput('');
                  }}
                  options={patients.map((p) => ({
                    value: p.id,
                    label: `[${p.queueNumber}] ${p.name} (${p.rmNumber})`,
                    sublabel: `Status: ${p.statusKunjungan}`,
                  }))}
                  placeholder="Pilih pasien antrean kasir..."
                />

                {activePatient && (
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{activePatient.name} ({activePatient.age} th)</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">NIK: {activePatient.nik} • HP: {activePatient.phone}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      activePatient.statusKunjungan === 'Menunggu Pembayaran'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : activePatient.statusKunjungan === 'Selesai'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {activePatient.statusKunjungan}
                    </span>
                  </div>
                )}
              </div>

              {/* Rincian Item Tindakan */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <AppIcon name="tooth" className="text-[#2D6A4F]" />
                    Rincian Tindakan & Prosedur (Poli Gigi 01)
                  </h3>
                  <span className="text-[11px] text-slate-400">{patientTreatments.length} Layanan</span>
                </div>

                <div className="space-y-2">
                  {patientTreatments.map((treatment, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{treatment.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ICD-9-CM: {treatment.icd9cm}</p>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        Rp {treatment.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal Tindakan:</span>
                    <span className="font-mono font-bold text-slate-800">Rp {subtotalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon {discountNote ? `(${discountNote})` : ''}:</span>
                      <span className="font-mono font-bold">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* KOLOM KANAN (5 Kolom): FORM PEMBAYARAN + DISKON + CICILAN */}
            <div className="lg:col-span-5 space-y-4">
              <form onSubmit={handleProcessPayment} className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#1B4332]/10 text-[#2D6A4F] flex items-center justify-center text-xs">
                      <AppIcon name="money-check-dollar" />
                    </div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Rincian Pembayaran</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{currentUser?.name || 'Kasir'}</span>
                </div>

                {/* Display Total Biaya */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    {isInstallment ? 'Total Tagihan Setelah Diskon' : 'Total Yang Harus Dibayar'}
                  </span>
                  <h2 className="text-3xl font-black font-mono text-[#1B4332]">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </h2>
                  {discountAmount > 0 && (
                    <p className="text-[10px] text-rose-600 font-semibold mt-1">
                      Hemat Rp {discountAmount.toLocaleString('id-ID')} dari Rp {subtotalAmount.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                {/* DISKON / POTONGAN HARGA */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <AppIcon name="tags" className="text-[#1B4332]" />
                      <span>Diskon / Promo</span>
                    </label>
                    <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('nominal');
                          setDiscountInput('');
                        }}
                        className={`px-2 py-0.5 rounded-md cursor-pointer ${
                          discountType === 'nominal' ? 'bg-[#1B4332] text-[#FAF7F0]' : 'text-slate-500'
                        }`}
                      >
                        Rp
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('percent');
                          setDiscountInput('');
                        }}
                        className={`px-2 py-0.5 rounded-md cursor-pointer ${
                          discountType === 'percent' ? 'bg-[#1B4332] text-[#FAF7F0]' : 'text-slate-500'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      max={discountType === 'percent' ? 100 : subtotalAmount}
                      placeholder={discountType === 'percent' ? '0 - 100 (%)' : 'Nominal Rp'}
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value === '' ? '' : Number(e.target.value))}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-mono font-bold text-slate-800 focus:outline-none focus:border-[#1B4332]"
                    />
                    <input
                      type="text"
                      placeholder="Keterangan (Promo/Asuransi)"
                      value={discountNote}
                      onChange={(e) => setDiscountNote(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                {/* SKEMA PEMBAYARAN: LUNAS VS CICILAN / DP */}
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">Skema Pembayaran:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsInstallment(false);
                        setPaidNowInput('');
                      }}
                      className={`py-2 px-3 rounded-xl border font-bold transition cursor-pointer ${
                        !isInstallment
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Bayar Lunas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInstallment(true);
                        if (paidNowInput === '') setPaidNowInput(Math.round(totalAmount * 0.5));
                      }}
                      className={`py-2 px-3 rounded-xl border font-bold transition cursor-pointer ${
                        isInstallment
                          ? 'bg-amber-500 border-amber-600 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Cicilan / DP
                    </button>
                  </div>

                  {isInstallment && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                      <label className="block font-bold text-amber-900">Nominal DP / Dibayar Sekarang (Rp):</label>
                      <input
                        type="number"
                        min={1}
                        max={totalAmount}
                        value={paidNowInput}
                        onChange={(e) => setPaidNowInput(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                      <div className="flex justify-between text-[11px] pt-1">
                        <span className="text-amber-800 font-semibold">Sisa Tagihan Cicilan:</span>
                        <strong className="font-mono text-rose-700">
                          Rp {remainingAfterPay.toLocaleString('id-ID')}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pilihan Metode Bayar */}
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">Pilih Metode Pembayaran:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'QRIS', label: 'QRIS', icon: 'qrcode' },
                      { id: 'Tunai', label: 'Tunai', icon: 'money-bill-wave' },
                      { id: 'Debit/Transfer', label: 'Transfer', icon: 'credit-card' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id as any);
                          if (m.id !== 'Tunai') setCashGiven('');
                        }}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer border ${
                          paymentMethod === m.id
                            ? 'bg-[#1B4332] border-[#20b88f] text-slate-950 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <AppIcon name={m.icon} className="w-4 h-4" />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Panel QRIS Dinamis & EDC Bridge */}
                <QrisEdcPanel
                  amount={amountDueNow}
                  patientName={activePatient?.name || 'Pasien'}
                  paymentMethod={paymentMethod}
                />

                {/* Input Tunai */}
                {paymentMethod === 'Tunai' && (
                  <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Uang Diterima dari Pasien (Rp):</label>
                      <input
                        type="number"
                        min={amountDueNow}
                        placeholder={`Minimal Rp ${amountDueNow.toLocaleString('id-ID')}`}
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-[#1B4332]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set([amountDueNow, 50000, 100000, 200000, 500000]))
                        .filter((nom) => nom > 0)
                        .map((nominal, idx) => (
                          <button
                            key={`cash-preset-${idx}-${nominal}`}
                            type="button"
                            onClick={() => setCashGiven(nominal)}
                            className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 hover:border-[#1B4332] cursor-pointer"
                          >
                            {nominal === amountDueNow ? 'Uang Pas' : `Rp ${nominal.toLocaleString('id-ID')}`}
                          </button>
                        ))}
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="text-slate-600 font-semibold">Uang Kembalian:</span>
                      <span className="font-mono font-black text-base text-emerald-700">
                        Rp {changeAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}

                {!completedInvoice ? (
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold text-xs shadow-md shadow-[#26d4a5]/20 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <AppIcon name="circle-check" />
                    <span>
                      {isInstallment
                        ? `Simpan DP Rp ${amountDueNow.toLocaleString('id-ID')} & Cetak Struk`
                        : 'Konfirmasi Pembayaran & Cetak Struk'}
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center">
                      <AppIcon name="check" className="text-emerald-600 mr-1.5" /> Transaksi Tersimpan!
                    </div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <AppIcon name="print" className="text-[#2D6A4F]" />
                      <span>Cetak Struk Kasir Termal 80mm</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : (
          /* TAB RIWAYAT TRANSAKSI & PELUNASAN CICILAN */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Riwayat Pembayaran & Pelunasan Cicilan</h2>
                <p className="text-[11px] text-slate-400">Kelola kwitansi lunas maupun pembayaran cicilan bertahap (behel/ortodonti)</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block">Total Invoice Tercatat</span>
                <strong className="text-sm font-mono text-[#1B4332]">{transactions.length} Kwitansi</strong>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">Belum ada transaksi pembayaran yang tercatat.</div>
              ) : (
                transactions.map((trx) => {
                  const isPartial = trx.status === 'PARTIAL' && trx.remainingAmount > 0;
                  return (
                    <div
                      key={trx.id}
                      className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                        isPartial ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shadow-2xs ${
                          isPartial ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-[#1B4332]'
                        }`}>
                          <AppIcon name="file-invoice" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-xs font-bold text-slate-900">{trx.patientName}</strong>
                            <span className="font-mono text-[10px] text-slate-500 font-semibold">{trx.rmNumber}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#1B4332]/10 text-[#1B4332]">
                              {trx.paymentMethod}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isPartial ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isPartial ? `CICILAN (Sisa Rp ${trx.remainingAmount.toLocaleString('id-ID')})` : 'LUNAS'}
                            </span>
                            {trx.discountAmount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700">
                                Diskon Rp {trx.discountAmount.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {trx.invoiceNo} • {trx.date} • Kasir: {trx.cashierName}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5 truncate max-w-md">
                            Layanan: {trx.treatments.join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Dibayar / Total
                          </span>
                          <strong className="text-xs font-mono text-slate-900">
                            Rp {(trx.paidAmount || trx.amount).toLocaleString('id-ID')} / Rp {trx.amount.toLocaleString('id-ID')}
                          </strong>
                        </div>

                        {isPartial && (
                          <button
                            type="button"
                            onClick={() => {
                              setInstallmentTarget(trx);
                              setInstallmentPayAmount(trx.remainingAmount);
                              setInstallmentMethod('QRIS');
                              setInstallmentNote('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <AppIcon name="coins" className="text-[11px]" />
                            <span>Bayar Cicilan</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setCompletedInvoice({
                              invoiceNo: trx.invoiceNo,
                              patientName: trx.patientName,
                              rmNumber: trx.rmNumber,
                              doctorName: trx.doctorName,
                              treatments: TREATMENTS.filter((t) => trx.treatments.includes(t.name)),
                              subtotal: trx.subtotal,
                              discountAmount: trx.discountAmount,
                              discountNote: trx.discountNote,
                              total: trx.amount,
                              paidAmount: trx.paidAmount,
                              remainingAmount: trx.remainingAmount,
                              status: trx.status,
                              paymentMethod: trx.paymentMethod,
                              cashGiven: trx.cashGiven,
                              change: trx.change,
                            });
                            setTimeout(() => window.print(), 100);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#1B4332] bg-white text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <AppIcon name="print" className="text-[11px]" />
                          <span>Cetak</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL BAYAR CICILAN LANJUTAN */}
      {installmentTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Pembayaran Cicilan / Pelunasan</h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  {installmentTarget.invoiceNo} • {installmentTarget.patientName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInstallmentTarget(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <AppIcon name="xmark" className="text-sm" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex justify-between items-center">
              <span className="font-semibold text-amber-900">Sisa Tagihan Saat Ini:</span>
              <strong className="font-mono text-base text-rose-700">
                Rp {installmentTarget.remainingAmount.toLocaleString('id-ID')}
              </strong>
            </div>

            <form onSubmit={handleAddInstallmentPayment} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Pembayaran (Rp) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={installmentTarget.remainingAmount}
                  value={installmentPayAmount}
                  onChange={(e) => setInstallmentPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <CustomSelect
                  value={installmentMethod}
                  onChange={(val) => setInstallmentMethod(val as 'Tunai' | 'QRIS' | 'Debit/Transfer')}
                  options={[
                    { value: 'QRIS', label: 'QRIS / EDC Dinamis' },
                    { value: 'Tunai', label: 'Tunai (Cash)' },
                    { value: 'Debit/Transfer', label: 'Debit / Transfer Bank' },
                  ]}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Cicilan ke-2 kontrol behel..."
                  value={installmentNote}
                  onChange={(e) => setInstallmentNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInstallmentTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold cursor-pointer"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {completedInvoice && <InvoiceReceipt invoiceData={completedInvoice} />}
    </div>
  );
}
