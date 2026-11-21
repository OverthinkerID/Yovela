'use client';

import React from 'react';
import { Treatment } from '../data/mockData';

export interface InvoiceData {
  invoiceNo: string;
  patientName: string;
  rmNumber: string;
  doctorName: string;
  treatments: Treatment[];
  subtotal?: number;
  discountAmount?: number;
  discountNote?: string;
  total: number;
  paidAmount?: number;
  remainingAmount?: number;
  status?: 'PAID' | 'PARTIAL' | 'VOID';
  paymentMethod?: 'Tunai' | 'QRIS' | 'Debit/Transfer';
  cashGiven?: number;
  change?: number;
}

interface InvoiceReceiptProps {
  invoiceData: InvoiceData;
}

export const InvoiceReceipt: React.FC<InvoiceReceiptProps> = ({ invoiceData }) => {
  const methodLabel = invoiceData.paymentMethod || 'Menunggu Pembayaran di Kasir';
  const subtotal = invoiceData.subtotal ?? invoiceData.total;
  const discount = invoiceData.discountAmount ?? 0;
  const paidNow = invoiceData.paidAmount ?? invoiceData.total;
  const remaining = invoiceData.remainingAmount ?? Math.max(0, invoiceData.total - paidNow);
  const statusLabel =
    invoiceData.status === 'PARTIAL' || remaining > 0
      ? 'CICILAN / DP'
      : invoiceData.paymentMethod
      ? 'LUNAS'
      : 'BELUM BAYAR';

  return (
    <aside
      aria-label="Struk Kasir Termal"
      className="hidden print:block fixed inset-0 m-0 p-4 bg-white text-black font-mono text-[11px] leading-tight z-[9999]"
      style={{ width: '80mm', maxWidth: '80mm' }}
    >
      <div className="text-center pb-2 border-b border-dashed border-black">
        <h2 className="text-sm font-bold uppercase tracking-wider">Yovela Dental Clinic</h2>
        <p className="text-[10px]">Jl. Pemuda No. 45, Semarang</p>
        <p className="text-[10px]">Telp: (024) 8765-4321</p>
      </div>

      <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>No. Bukti:</span>
          <span className="font-bold">{invoiceData.invoiceNo}</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu:</span>
          <span>{new Date().toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span>Pasien:</span>
          <span className="font-bold">{invoiceData.patientName}</span>
        </div>
        <div className="flex justify-between">
          <span>No. RM:</span>
          <span>{invoiceData.rmNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Dokter:</span>
          <span className="truncate max-w-[140px]">{invoiceData.doctorName}</span>
        </div>
      </div>

      <div className="py-2 border-b border-dashed border-black space-y-1">
        <div className="flex justify-between font-bold text-[10px]">
          <span>Tindakan / Prosedur</span>
          <span>Tarif</span>
        </div>
        {invoiceData.treatments.map((item, idx) => (
          <div key={idx} className="flex justify-between text-[10px]">
            <span className="truncate max-w-[150px]">{item.name}</span>
            <span>Rp {item.price.toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>

      <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
        {discount > 0 && (
          <>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Diskon{invoiceData.discountNote ? ` (${invoiceData.discountNote})` : ''}:</span>
              <span>- Rp {discount.toLocaleString('id-ID')}</span>
            </div>
          </>
        )}
        <div className="flex justify-between font-bold text-[11px]">
          <span>TOTAL TAGIHAN:</span>
          <span>Rp {invoiceData.total.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span>Dibayar:</span>
          <span className="font-bold">Rp {paidNow.toLocaleString('id-ID')}</span>
        </div>
        {remaining > 0 && (
          <div className="flex justify-between font-bold">
            <span>SISA TAGIHAN:</span>
            <span>Rp {remaining.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Metode Bayar:</span>
          <span>{methodLabel}</span>
        </div>
        {invoiceData.paymentMethod === 'Tunai' && typeof invoiceData.cashGiven === 'number' && (
          <>
            <div className="flex justify-between">
              <span>Uang Diterima:</span>
              <span>Rp {invoiceData.cashGiven.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembalian:</span>
              <span>Rp {(invoiceData.change || 0).toLocaleString('id-ID')}</span>
            </div>
          </>
        )}
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="font-bold">{statusLabel}</span>
        </div>
      </div>

      <div className="pt-3 text-center text-[9px] space-y-0.5">
        <p>Terima kasih atas kunjungan Anda.</p>
        <p>Lekas sembuh &amp; senyum sehat selalu.</p>
        <p className="font-bold">Simpan struk ini sebagai bukti pembayaran resmi.</p>
      </div>
    </aside>
  );
};
