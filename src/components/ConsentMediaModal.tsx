'use client';

import React, { useState, useEffect } from 'react';
import { AppIcon } from './AppIcon';
import { CustomSelect } from './CustomSelect';
import { SignaturePad } from './SignaturePad';

export interface ConsentState {
  consentSigned: boolean;
  consentSignerName?: string | null;
  consentProcedure?: string | null;
  consentSignatureData?: string | null;
  consentSignedAt?: string | null;
}

export interface ClinicalMediaItem {
  id: string;
  mediaType: 'INTRAORAL' | 'RONTGEN' | 'BEFORE' | 'AFTER';
  caption: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
}

interface ConsentMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  encounterId: string;
  patientName: string;
  rmNumber: string;
  defaultProcedure: string;
  doctorName: string;
  onStatusChange?: (consentSigned: boolean, mediaCount: number) => void;
}

async function compressImageToDataUrl(file: File, maxDim = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('File bukan gambar yang valid.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const ConsentMediaModal: React.FC<ConsentMediaModalProps> = ({
  isOpen,
  onClose,
  encounterId,
  patientName,
  rmNumber,
  defaultProcedure,
  doctorName,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState<'consent' | 'media'>('consent');
  const [consent, setConsent] = useState<ConsentState>({ consentSigned: false });
  const [signerName, setSignerName] = useState(patientName);
  const [procedure, setProcedure] = useState(defaultProcedure);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSavingConsent, setIsSavingConsent] = useState(false);

  const [mediaList, setMediaList] = useState<ClinicalMediaItem[]>([]);
  const [mediaType, setMediaType] = useState<'INTRAORAL' | 'RONTGEN' | 'BEFORE' | 'AFTER'>('INTRAORAL');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<ClinicalMediaItem | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  useEffect(() => {
    if (!isOpen || !encounterId) return;
    setSignerName(patientName);
    setProcedure(defaultProcedure || 'Tindakan Kedokteran Gigi');
    setSignatureData(null);

    const loadAll = async () => {
      try {
        const [cRes, mRes] = await Promise.all([
          fetch(`/api/encounters/${encounterId}/consent`, { cache: 'no-store' }),
          fetch(`/api/encounters/${encounterId}/media`, { cache: 'no-store' }),
        ]);
        let signed = false;
        let count = 0;
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.consent) {
            setConsent(cData.consent);
            signed = Boolean(cData.consent.consentSigned);
            if (cData.consent.consentSignerName) setSignerName(cData.consent.consentSignerName);
            if (cData.consent.consentProcedure) setProcedure(cData.consent.consentProcedure);
          }
        }
        if (mRes.ok) {
          const mData = await mRes.json();
          const list: ClinicalMediaItem[] = mData.media || [];
          setMediaList(list);
          count = list.length;
        }
        onStatusChange?.(signed, count);
      } catch (err) {
        console.error('Gagal memuat Consent & Media:', err);
      }
    };
    loadAll();
  }, [isOpen, encounterId, patientName, defaultProcedure]);

  if (!isOpen) return null;

  const handleSaveConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureData) {
      showFeedback('Harap bubuhkan tanda tangan digital pada area kanvas terlebih dahulu.');
      return;
    }
    setIsSavingConsent(true);
    try {
      const res = await fetch(`/api/encounters/${encounterId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName,
          procedure,
          signatureData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showFeedback(data.error || 'Gagal menyimpan Informed Consent.');
        return;
      }
      setConsent(data.consent);
      onStatusChange?.(true, mediaList.length);
      showFeedback('Informed Consent digital berhasil ditandatangani & disimpan ke database!');
    } catch {
      showFeedback('Gagal terhubung ke server database.');
    } finally {
      setIsSavingConsent(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      const res = await fetch(`/api/encounters/${encounterId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType,
          caption: caption.trim() || `${mediaType} — ${patientName}`,
          fileName: file.name,
          mimeType: 'image/jpeg',
          dataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showFeedback(data.error || 'Gagal mengunggah foto.');
        return;
      }
      const nextList = [data.media, ...mediaList];
      setMediaList(nextList);
      setCaption('');
      onStatusChange?.(consent.consentSigned, nextList.length);
      showFeedback(`Foto ${mediaType} berhasil diunggah ke rekam medis pasien!`);
    } catch (err: any) {
      showFeedback(err?.message || 'Gagal memproses file gambar.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      const res = await fetch(`/api/encounters/${encounterId}/media?mediaId=${mediaId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const nextList = mediaList.filter((m) => m.id !== mediaId);
        setMediaList(nextList);
        onStatusChange?.(consent.consentSigned, nextList.length);
        showFeedback('Foto klinis berhasil dihapus.');
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Informed Consent Digital &amp; Galeri Foto Klinis
            </h3>
            <p className="text-[11px] text-slate-400">
              Pasien: <strong className="text-slate-700">{patientName}</strong> ({rmNumber}) • Dokter: {doctorName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <AppIcon name="xmark" className="w-4 h-4" />
          </button>
        </div>

        {/* Switcher Tab */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl font-bold gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('consent')}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'consent' ? 'bg-white text-[#1B4332] shadow-xs' : 'text-slate-500'
            }`}
          >
            <AppIcon name="file-invoice" className="w-3.5 h-3.5" />
            <span>Informed Consent {consent.consentSigned ? '✓' : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'media' ? 'bg-white text-[#1B4332] shadow-xs' : 'text-slate-500'
            }`}
          >
            <AppIcon name="cloud-arrow-up" className="w-3.5 h-3.5" />
            <span>Foto Intraoral &amp; Rontgen ({mediaList.length})</span>
          </button>
        </div>

        {feedbackMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px]">
            {feedbackMsg}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {activeTab === 'consent' ? (
            <div className="space-y-4">
              {consent.consentSigned && consent.consentSignatureData && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <AppIcon name="circle-check" className="w-4 h-4 text-emerald-600" />
                      Persetujuan Tindakan Medis Telah Ditandatangani
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700">
                      {consent.consentSignedAt
                        ? new Date(consent.consentSignedAt).toLocaleString('id-ID')
                        : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    Penanda tangan: <strong>{consent.consentSignerName}</strong> • Tindakan:{' '}
                    <strong>{consent.consentProcedure}</strong>
                  </p>
                  <div className="bg-white rounded-xl border border-emerald-200 p-2 inline-block">
                    <img
                      src={consent.consentSignatureData}
                      alt="Tanda Tangan Digital Pasien"
                      className="h-20 object-contain"
                    />
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveConsent} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  Saya yang bertanda tangan di bawah ini menyatakan telah menerima penjelasan yang jelas dari{' '}
                  <strong>{doctorName}</strong> mengenai tujuan, prosedur, manfaat, risiko, serta alternatif tindakan kedokteran gigi dan menyetujui pelaksanaannya.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Penanda Tangan (Pasien / Wali) *</label>
                    <input
                      type="text"
                      required
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tindakan yang Disetujui *</label>
                    <input
                      type="text"
                      required
                      value={procedure}
                      onChange={(e) => setProcedure(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanda Tangan Digital (Canvas):</label>
                  <SignaturePad onChange={setSignatureData} height={150} />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSavingConsent}
                    className="px-5 py-2.5 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold cursor-pointer transition disabled:opacity-60"
                  >
                    {isSavingConsent
                      ? 'Menyimpan...'
                      : consent.consentSigned
                      ? 'Perbarui Tanda Tangan Consent'
                      : 'Simpan Persetujuan Digital'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenis Foto Klinis</label>
                    <CustomSelect
                      value={mediaType}
                      onChange={(val) => setMediaType(val as 'INTRAORAL' | 'RONTGEN' | 'BEFORE' | 'AFTER')}
                      options={[
                        { value: 'INTRAORAL', label: 'Foto Intraoral' },
                        { value: 'RONTGEN', label: 'Rontgen Periapikal / Panoramik' },
                        { value: 'BEFORE', label: 'Kondisi Before (Sebelum)' },
                        { value: 'AFTER', label: 'Kondisi After (Sesudah)' },
                      ]}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Keterangan / Nomor Gigi</label>
                    <input
                      type="text"
                      placeholder="Contoh: Rontgen periapikal gigi 38 impaksi..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-[#1B4332] bg-[#1B4332]/10 hover:bg-[#1B4332]/15 text-[#1B4332] font-bold cursor-pointer transition">
                  <AppIcon name="cloud-arrow-up" className="w-4 h-4" />
                  <span>{isUploading ? 'Mengompresi & Mengunggah...' : 'Pilih / Ambil Foto Intraoral atau Rontgen'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Galeri Foto */}
              {mediaList.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  Belum ada foto intraoral atau rontgen yang diunggah pada kunjungan ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {mediaList.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs flex flex-col"
                    >
                      <div
                        onClick={() => setLightboxMedia(item)}
                        className="h-36 bg-slate-900 cursor-pointer overflow-hidden relative group"
                      >
                        <img
                          src={item.dataUrl}
                          alt={item.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-950/80 text-[#2D6A4F]">
                          {item.mediaType}
                        </span>
                      </div>
                      <div className="p-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate text-[11px]">{item.caption}</p>
                          <p className="text-[9px] text-slate-400 font-mono truncate">{item.fileName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(item.id)}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] cursor-pointer shrink-0"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Preview Foto Besar */}
      {lightboxMedia && (
        <div
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-[60] bg-slate-950/90 flex items-center justify-center p-6 cursor-zoom-out"
        >
          <div className="max-w-4xl max-h-[88vh] flex flex-col items-center space-y-2">
            <img
              src={lightboxMedia.dataUrl}
              alt={lightboxMedia.caption}
              className="max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/15"
            />
            <p className="text-white text-xs font-bold">
              [{lightboxMedia.mediaType}] {lightboxMedia.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
