'use client';

import React from 'react';

export type ToothSurface = 'occlusal' | 'mesial' | 'distal' | 'buccal' | 'lingual';

export type GeneralToothCondition =
  | 'normal'
  | 'missing'
  | 'radix'
  | 'impacted'
  | 'rct'
  | 'full_crown';

export interface ToothData {
  generalCondition?: GeneralToothCondition;
  surfaces: Record<ToothSurface, string | null>;
  notes?: string;
}

export const GENERAL_CONDITION_LABELS: Record<GeneralToothCondition, string> = {
  normal: 'Normal / Erupsi',
  missing: 'Missing / Hilang (X)',
  radix: 'Radix / Sisa Akar (R)',
  impacted: 'Impaksi / Tertanam',
  rct: 'PSA / Endodontik (RCT)',
  full_crown: 'Mahkota / Crown (CRN)',
};

interface ToothProps {
  toothNumber: number;
  data?: ToothData;
  isDeciduous?: boolean;
  isSelected?: boolean;
  selectedSurface?: ToothSurface | null;
  onSurfaceClick: (toothNumber: number, surface: ToothSurface) => void;
  onToothConditionClick: (toothNumber: number) => void;
}

export const SURFACE_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  caries: { fill: '#ef4444', stroke: '#b91c1c', label: 'Karies (CAR)' },
  composite: { fill: '#26d4a5', stroke: '#0fa882', label: 'Komposit (CFR)' },
  amalgam: { fill: '#64748b', stroke: '#334155', label: 'Amalgam (AMF)' },
  gic: { fill: '#10b981', stroke: '#047857', label: 'GIC (Fisur)' },
  temporary: { fill: '#f59e0b', stroke: '#b45309', label: 'Tumpatan Sementara' },
};

/**
 * Orientasi permukaan gigi sesuai standar anatomi FDI (dilihat dari depan pasien):
 * - Kuadran Kanan Pasien (Q1, Q4, Q5, Q8 — sisi kiri layar): Mesial di KANAN (menuju garis tengah), Distal di KIRI.
 * - Kuadran Kiri Pasien (Q2, Q3, Q6, Q7 — sisi kanan layar): Mesial di KIRI (menuju garis tengah), Distal di KANAN.
 * - Rahang Atas (Q1, Q2, Q5, Q6): Bukal/Labial di ATAS, Palatal/Lingual di BAWAH.
 * - Rahang Bawah (Q3, Q4, Q7, Q8): Lingual di ATAS (menuju lidah), Bukal/Labial di BAWAH.
 */
export function getFdiSurfaceMap(toothNumber: number): {
  top: { surface: ToothSurface; label: string };
  bottom: { surface: ToothSurface; label: string };
  left: { surface: ToothSurface; label: string };
  right: { surface: ToothSurface; label: string };
  center: { surface: ToothSurface; label: string };
} {
  const quadrant = Math.floor(toothNumber / 10);
  const toothPos = toothNumber % 10;
  const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
  const isRightPatientSide = quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8;
  const isAnterior = toothPos >= 1 && toothPos <= 3;

  const buccalLabel = isAnterior ? 'Labial (Bukal)' : 'Bukal';
  const lingualLabel = isUpper ? 'Palatal (Lingual)' : 'Lingual';
  const centerLabel = isAnterior ? 'Insisal (Oklusal)' : 'Oklusal';

  return {
    top: isUpper
      ? { surface: 'buccal', label: buccalLabel }
      : { surface: 'lingual', label: lingualLabel },
    bottom: isUpper
      ? { surface: 'lingual', label: lingualLabel }
      : { surface: 'buccal', label: buccalLabel },
    left: isRightPatientSide
      ? { surface: 'distal', label: 'Distal' }
      : { surface: 'mesial', label: 'Mesial' },
    right: isRightPatientSide
      ? { surface: 'mesial', label: 'Mesial' }
      : { surface: 'distal', label: 'Distal' },
    center: { surface: 'occlusal', label: centerLabel },
  };
}

export const Tooth: React.FC<ToothProps> = ({
  toothNumber,
  data,
  isDeciduous = false,
  isSelected = false,
  selectedSurface = null,
  onSurfaceClick,
  onToothConditionClick,
}) => {
  const surfaces = data?.surfaces || {
    occlusal: null,
    mesial: null,
    distal: null,
    buccal: null,
    lingual: null,
  };
  const generalCondition = data?.generalCondition || 'normal';
  const surfaceMap = getFdiSurfaceMap(toothNumber);

  const getSurfaceColor = (surf: ToothSurface) => {
    const cond = surfaces[surf];
    if (cond && SURFACE_COLORS[cond]) {
      return SURFACE_COLORS[cond].fill;
    }
    return '#ffffff';
  };

  const isMissing = generalCondition === 'missing';
  const isRadix = generalCondition === 'radix';
  const isImpacted = generalCondition === 'impacted';
  const isRct = generalCondition === 'rct';
  const isCrown = generalCondition === 'full_crown';

  return (
    <div className="flex flex-col items-center p-0.5 select-none group font-['Poppins',sans-serif]">
      {/* Tombol Nomor FDI Gigi */}
      <button
        type="button"
        onClick={() => onToothConditionClick(toothNumber)}
        title={`Status & Catatan Gigi #${toothNumber}`}
        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 mb-1 rounded-md cursor-pointer transition-all duration-150 transform group-hover:scale-110 ${
          isSelected
            ? 'bg-[#E63946] text-white font-black shadow-sm ring-2 ring-[#E63946]/30'
            : isDeciduous
            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
            : generalCondition !== 'normal'
            ? 'bg-[#1B4332] text-[#FAF7F0] font-black shadow-xs'
            : 'bg-slate-100 text-slate-700 hover:bg-[#1B4332]/15 hover:text-slate-900'
        }`}
      >
        {toothNumber}
      </button>

      {/* Kotak Gigi dengan Orientasi Anatomi FDI */}
      <div
        className={`relative p-1 rounded-xl bg-white border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-[#1B4332] ${
          isSelected
            ? 'border-[#E63946] ring-2 ring-[#E63946]/40 shadow-md'
            : isImpacted
            ? 'border-dashed border-amber-500 bg-amber-50/40'
            : 'border-slate-200 shadow-2xs'
        } ${isCrown && !isSelected ? 'ring-2 ring-amber-400 bg-amber-50/20' : ''}`}
      >
        <svg viewBox="0 0 100 100" className="w-9 h-9 md:w-10 md:h-10">
          {/* 1. Segmen Atas (Bukal/Labial di Rahang Atas, Lingual di Rahang Bawah) */}
          <polygon
            points="10,10 90,10 70,30 30,30"
            fill={getSurfaceColor(surfaceMap.top.surface)}
            stroke={isSelected && selectedSurface === surfaceMap.top.surface ? '#1B4332' : '#94a3b8'}
            strokeWidth={isSelected && selectedSurface === surfaceMap.top.surface ? '3' : '1.5'}
            className="tooth-segment"
            onClick={() => onSurfaceClick(toothNumber, surfaceMap.top.surface)}
          >
            <title>{`Gigi #${toothNumber} — ${surfaceMap.top.label}`}</title>
          </polygon>

          {/* 2. Segmen Kanan (Mesial di Q1/Q4/Q5/Q8, Distal di Q2/Q3/Q6/Q7) */}
          <polygon
            points="90,10 90,90 70,70 70,30"
            fill={getSurfaceColor(surfaceMap.right.surface)}
            stroke={isSelected && selectedSurface === surfaceMap.right.surface ? '#1B4332' : '#94a3b8'}
            strokeWidth={isSelected && selectedSurface === surfaceMap.right.surface ? '3' : '1.5'}
            className="tooth-segment"
            onClick={() => onSurfaceClick(toothNumber, surfaceMap.right.surface)}
          >
            <title>{`Gigi #${toothNumber} — ${surfaceMap.right.label}`}</title>
          </polygon>

          {/* 3. Segmen Bawah (Palatal di Rahang Atas, Bukal/Labial di Rahang Bawah) */}
          <polygon
            points="90,90 10,90 30,70 70,70"
            fill={getSurfaceColor(surfaceMap.bottom.surface)}
            stroke={isSelected && selectedSurface === surfaceMap.bottom.surface ? '#1B4332' : '#94a3b8'}
            strokeWidth={isSelected && selectedSurface === surfaceMap.bottom.surface ? '3' : '1.5'}
            className="tooth-segment"
            onClick={() => onSurfaceClick(toothNumber, surfaceMap.bottom.surface)}
          >
            <title>{`Gigi #${toothNumber} — ${surfaceMap.bottom.label}`}</title>
          </polygon>

          {/* 4. Segmen Kiri (Distal di Q1/Q4/Q5/Q8, Mesial di Q2/Q3/Q6/Q7) */}
          <polygon
            points="10,90 10,10 30,30 30,70"
            fill={getSurfaceColor(surfaceMap.left.surface)}
            stroke={isSelected && selectedSurface === surfaceMap.left.surface ? '#1B4332' : '#94a3b8'}
            strokeWidth={isSelected && selectedSurface === surfaceMap.left.surface ? '3' : '1.5'}
            className="tooth-segment"
            onClick={() => onSurfaceClick(toothNumber, surfaceMap.left.surface)}
          >
            <title>{`Gigi #${toothNumber} — ${surfaceMap.left.label}`}</title>
          </polygon>

          {/* 5. Segmen Tengah (Oklusal / Insisal) */}
          <polygon
            points="30,30 70,30 70,70 30,70"
            fill={getSurfaceColor(surfaceMap.center.surface)}
            stroke={isSelected && selectedSurface === surfaceMap.center.surface ? '#1B4332' : '#94a3b8'}
            strokeWidth={isSelected && selectedSurface === surfaceMap.center.surface ? '3' : '1.5'}
            className="tooth-segment"
            onClick={() => onSurfaceClick(toothNumber, surfaceMap.center.surface)}
          >
            <title>{`Gigi #${toothNumber} — ${surfaceMap.center.label}`}</title>
          </polygon>

          {/* Layer Kondisi Khusus: Missing / Hilang (Silang Merah) */}
          {isMissing && (
            <g stroke="#dc2626" strokeWidth="4" strokeLinecap="round" className="pointer-events-none">
              <line x1="10" y1="10" x2="90" y2="90" />
              <line x1="90" y1="10" x2="10" y2="90" />
            </g>
          )}

          {/* Layer Kondisi Khusus: Radix / Sisa Akar (Simbol R) */}
          {isRadix && (
            <g fill="#ea580c" opacity="0.85" className="pointer-events-none">
              <polygon points="50,15 85,85 15,85" />
              <text x="50" y="65" fontSize="24" fontWeight="bold" textAnchor="middle" fill="#ffffff">
                R
              </text>
            </g>
          )}

          {/* Layer Kondisi Khusus: RCT / Endodontik (Garis Biru) */}
          {isRct && (
            <g stroke="#2563eb" strokeWidth="4" strokeLinecap="round" className="pointer-events-none">
              <line x1="50" y1="5" x2="50" y2="95" />
              <line x1="30" y1="5" x2="70" y2="5" />
            </g>
          )}
        </svg>

        {/* Badge Mahkota / Crown (CRN) */}
        {isCrown && (
          <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-white font-extrabold px-1 rounded-full shadow-2xs pointer-events-none">
            CRN
          </span>
        )}
      </div>

      {/* Indikator Titik Mint Catatan Klinis */}
      {data?.notes && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] mt-1" title={data.notes} />
      )}
    </div>
  );
};
