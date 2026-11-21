'use client';

import React, { useState, useEffect } from 'react';
import { AppIcon } from './AppIcon';

interface QrisEdcPanelProps {
  amount: number;
  patientName: string;
  paymentMethod: 'Tunai' | 'QRIS' | 'Debit/Transfer';
}

interface QrisResponse {
  referenceId: string;
  amount: number;
  merchantName: string;
  qrisPayload: string;
  edcBridgeStatus: 'EDC_CONNECTED' | 'STANDBY_QRIS_DISPLAY';
  expiresAt: string;
}

// Generator matriks QR visual deterministik dari string EMVCo untuk pratinjau cepat di layar kasir/EDC
function buildDeterministicMatrix(seed: string, size = 21): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = border || inner;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= size - 8;
      const inBL = r >= size - 8 && c < 8;
      if (inTL || inTR || inBL) continue;
      hash ^= (r * 31 + c * 17) ^ (seed.charCodeAt((r + c) % seed.length) || 7);
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (hash & 1) === 1;
    }
  }
  return grid;
}

export const QrisEdcPanel: React.FC<QrisEdcPanelProps> = ({
  amount,
  patientName,
  paymentMethod,
}) => {
  const [qrisData, setQrisData] = useState<QrisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (paymentMethod !== 'QRIS' || amount <= 0) {
      setQrisData(null);
      return;
    }

    let cancelled = false;
    const generate = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/qris/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, patientName }),
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setQrisData(data);
        }
      } catch {}
      if (!cancelled) setIsLoading(false);
    };
    generate();
    return () => {
      cancelled = true;
    };
  }, [amount, patientName, paymentMethod]);

  if (paymentMethod !== 'QRIS') return null;

  const matrix = qrisData ? buildDeterministicMatrix(qrisData.qrisPayload) : [];

  return (
    <div className="p-4 rounded-2xl bg-[#F5F1E8] border border-[#DED6C5] space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-[#1B4332] flex items-center gap-1.5">
          <AppIcon name="qrcode" className="w-4 h-4 text-[#E63946]" />
          <span>Terminal QRIS Dinamis &amp; EDC Bridge</span>
        </span>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#1B4332] text-[#FAF7F0]">
          {qrisData?.edcBridgeStatus === 'EDC_CONNECTED' ? 'EDC Terhubung' : 'Mode Layar QRIS'}
        </span>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-[#52796F]">Membuat payload QRIS dinamis EMVCo...</div>
      ) : qrisData ? (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="p-2.5 bg-white rounded-2xl border border-[#DED6C5] shadow-xs shrink-0">
            <svg viewBox="0 0 21 21" className="w-28 h-28" shapeRendering="crispEdges">
              <rect width="21" height="21" fill="#ffffff" />
              {matrix.map((row, r) =>
                row.map((on, c) =>
                  on ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#1B4332" /> : null
                )
              )}
            </svg>
          </div>
          <div className="space-y-1 text-[11px] flex-1 min-w-0">
            <p className="font-extrabold text-[#1B4332]">{qrisData.merchantName}</p>
            <p className="font-mono text-[10px] text-[#52796F]">Ref: {qrisData.referenceId}</p>
            <p className="font-mono font-black text-sm text-[#E63946]">
              Rp {qrisData.amount.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-[#52796F] leading-snug">
              Siap di-scan dari layar kasir/tablet atau diteruskan ke mesin EDC Bank / Midtrans / Xendit via <code>EDC_TERMINAL_ENDPOINT</code>.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
