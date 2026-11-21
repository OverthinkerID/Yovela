'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppIcon } from "@/components/AppIcon";
import { 
  Tooth, 
  ToothSurface, 
  GeneralToothCondition, 
  ToothData 
} from '../../../components/Odontogram';
import { InvoiceReceipt } from '../../../components/InvoiceReceipt';
import { ConsentMediaModal } from '../../../components/ConsentMediaModal';
import { CustomSelect } from '../../../components/CustomSelect';
import { TREATMENTS, DIAGNOSES, Treatment } from '../../../data/mockData';
import { 
  PatientRecord, 
  getStoredPatients, 
  saveStoredPatients, 
  getActivePatient, 
  setActivePatient 
} from '../../../data/patientDatabase';
import { useAuth } from '../../../context/AuthContext';

export default function DentalClinicDashboard() {
  const { currentUser } = useAuth();

  const activeDoctorName = currentUser?.role === 'DOKTER' 
    ? currentUser.name 
    : 'drg. Yuli Kartilla Panjaitan';
  
  const activeDoctorLabel = currentUser?.role === 'DOKTER'
    ? currentUser.roleLabel
    : 'Dokter Gigi Umum';

  interface EncounterHistoryItem {
    id: string;
    visitDate: string;
    queueNumber: string;
    statusKunjungan: string;
    doctorName: string;
    subjective: string;
    objective: string;
    diagnosisIcd10: string;
    suggestedTreatments: string[];
    prescriptionNotes: string;
    odontogram: Record<number, ToothData>;
    dentitionType: 'adult' | 'deciduous' | 'mixed';
    dmft: { d: number; m: number; f: number; total: number };
    invoice: { invoiceNo: string; amount: number; paymentMethod: string; paidAt: string } | null;
  }

  const [patientList, setPatientList] = useState<PatientRecord[]>([]);
  const [treatmentCatalog, setTreatmentCatalog] = useState<Treatment[]>(TREATMENTS);
  const [showTariffModal, setShowTariffModal] = useState(false);
  const [showConsentMediaModal, setShowConsentMediaModal] = useState(false);
  const [consentSignedBadge, setConsentSignedBadge] = useState(false);
  const [mediaCountBadge, setMediaCountBadge] = useState(0);
  const [newTariffName, setNewTariffName] = useState('');
  const [newTariffCategory, setNewTariffCategory] = useState<Treatment['category']>('Pemeriksaan & Preventif');
  const [newTariffIcd9, setNewTariffIcd9] = useState('89.31');
  const [newTariffPrice, setNewTariffPrice] = useState<number | ''>('');
  const [tariffMsg, setTariffMsg] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'soap' | 'billing' | 'history' | 'visits'>('soap');
  const [visitHistory, setVisitHistory] = useState<EncounterHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [previewEncounter, setPreviewEncounter] = useState<EncounterHistoryItem | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const q2 = [21, 22, 23, 24, 25, 26, 27, 28];
  const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

  const q5 = [55, 54, 53, 52, 51];
  const q6 = [61, 62, 63, 64, 65];
  const q8 = [85, 84, 83, 82, 81];
  const q7 = [71, 72, 73, 74, 75];

  const [dentitionView, setDentitionView] = useState<'adult' | 'deciduous' | 'mixed'>('adult');
  const [selectedSurfaceColor, setSelectedSurfaceColor] = useState<string>('caries');
  const [selectedGeneralCondition, setSelectedGeneralCondition] = useState<GeneralToothCondition>('normal');

  const [activeToothModal, setActiveToothModal] = useState<number | null>(null);
  const [toothNoteInput, setToothNoteInput] = useState<string>('');

  const [odontogram, setOdontogram] = useState<Record<number, ToothData>>({});
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [diagnosis, setDiagnosis] = useState('K02.1');
  const [selectedTreatments, setSelectedTreatments] = useState<Treatment[]>([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('Asam Mefenamat 500mg (3x1 sesudah makan, bila nyeri)');

  const [isCompleted, setIsCompleted] = useState(false);
  const [isCallingTV, setIsCallingTV] = useState(false);

  const refreshTreatments = async () => {
    try {
      const res = await fetch('/api/treatments', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.treatments) && data.treatments.length > 0) {
          setTreatmentCatalog(data.treatments);
          return data.treatments as Treatment[];
        }
      }
    } catch {}
    return TREATMENTS;
  };

  useEffect(() => {
    const loadFromApi = async () => {
      try {
        const [pRes, loadedTreatments] = await Promise.all([
          fetch('/api/patients', { cache: 'no-store' }),
          refreshTreatments(),
        ]);
        if (!pRes.ok) return;
        const data = await pRes.json();
        const list: PatientRecord[] = data.patients || [];
        setPatientList(list);
        if (list.length > 0) {
          const savedActiveId = typeof window !== 'undefined' ? localStorage.getItem('yovela_active_patient_id') : null;
          const active = list.find((p) => p.id === savedActiveId) || list[0];
          loadPatientData(active, loadedTreatments);
        }
      } catch (err) {
        console.error('Gagal memuat data poli:', err);
      }
    };
    loadFromApi();
  }, []);

  const fetchVisitHistory = async (patientId: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/encounters`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setVisitHistory(data.encounters || []);
      } else {
        setVisitHistory([]);
      }
    } catch {
      setVisitHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadPatientData = (patient: PatientRecord, catalogOverride?: Treatment[]) => {
    const catalog = catalogOverride || treatmentCatalog;
    setSelectedPatient(patient);
    setActivePatient(patient);
    setPreviewEncounter(null);
    setOdontogram(patient.initialOdontogram || {});
    setSubjective(patient.lastSoap?.subjective || '');
    setObjective(patient.lastSoap?.objective || '');
    setDiagnosis(patient.lastSoap?.diagnosisIcd10 || 'K02.1');
    setPrescriptionNotes(
      patient.lastSoap?.prescriptionNotes ?? 'Asam Mefenamat 500mg (3x1 sesudah makan, bila nyeri)'
    );

    const matched = catalog.filter((t) => patient.lastSoap?.suggestedTreatments?.includes(t.id));
    setSelectedTreatments(matched.length > 0 ? matched : [catalog[0] || TREATMENTS[0]]);
    setIsCompleted(false);

    if (patient.age <= 12) setDentitionView('mixed');
    else setDentitionView('adult');

    fetchVisitHistory(patient.id);
  };

  const handleSelectPatient = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = patientList.find((p) => p.id === e.target.value);
    if (chosen) loadPatientData(chosen);
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patientList;
    const q = searchQuery.toLowerCase();
    return patientList.filter(
      (p) => p.name.toLowerCase().includes(q) || p.rmNumber.toLowerCase().includes(q) || p.nik.includes(q)
    );
  }, [patientList, searchQuery]);

  const syncOdontogramToSoap = (currentOdonto: Record<number, ToothData>) => {
    const findings: string[] = [];
    let detectedDiagnosis = diagnosis;

    Object.entries(currentOdonto).forEach(([toothNum, data]) => {
      if (data.generalCondition === 'missing') {
        findings.push(`Gigi ${toothNum} missing`);
      } else if (data.generalCondition === 'radix') {
        findings.push(`Gigi ${toothNum} sisa akar (radix)`);
        detectedDiagnosis = 'K04.1';
      } else if (data.generalCondition === 'impacted') {
        findings.push(`Gigi ${toothNum} impaksi`);
        detectedDiagnosis = 'K01.1';
      } else if (data.generalCondition === 'rct') {
        findings.push(`Gigi ${toothNum} pasca PSA`);
      }

      const cariesSurfaces = Object.entries(data.surfaces)
        .filter(([_, val]) => val === 'caries')
        .map(([surf]) => surf);

      const fillingSurfaces = Object.entries(data.surfaces)
        .filter(([_, val]) => val === 'composite' || val === 'amalgam' || val === 'gic' || val === 'temporary')
        .map(([surf, val]) => `${surf} (${val})`);

      if (cariesSurfaces.length > 0) {
        findings.push(`Gigi ${toothNum} karies permukaan ${cariesSurfaces.join(', ')}`);
        if (detectedDiagnosis === 'K02.1' || !detectedDiagnosis) {
          detectedDiagnosis = 'K02.1';
        }
      }

      if (fillingSurfaces.length > 0) {
        findings.push(`Gigi ${toothNum} tumpatan ${fillingSurfaces.join(', ')}`);
      }

      if (data.notes && data.notes.trim() !== '') {
        findings.push(`Catatan gigi ${toothNum}: ${data.notes}`);
      }
    });

    if (findings.length > 0) {
      setObjective(findings.join('. ') + '.');
      setDiagnosis(detectedDiagnosis);
    } else {
      setObjective('Pemeriksaan intraoral dalam batas normal, tidak ditemukan karies aktif.');
    }
  };

  const totalBilling = selectedTreatments.reduce((acc, curr) => acc + curr.price, 0);

  const dmftScore = useMemo(() => {
    let d = 0, m = 0, f = 0;
    Object.entries(odontogram).forEach(([_, data]) => {
      if (data.generalCondition === 'missing') m++;
      const hasCaries = Object.values(data.surfaces).some((v) => v === 'caries');
      const hasFilling = Object.values(data.surfaces).some((v) => v === 'composite' || v === 'amalgam' || v === 'gic' || v === 'temporary');
      if (hasCaries) d++;
      if (hasFilling && !hasCaries) f++;
    });
    return { d, m, f, total: d + m + f };
  }, [odontogram]);

  const activeBoardOdontogram = previewEncounter ? previewEncounter.odontogram : odontogram;

  const handleSurfaceClick = (tooth: number, surface: ToothSurface) => {
    if (previewEncounter) return;
    setOdontogram((prev) => {
      const current = prev[tooth] || {
        generalCondition: 'normal',
        surfaces: { occlusal: null, mesial: null, distal: null, buccal: null, lingual: null },
      };

      const existingColor = current.surfaces[surface];
      const nextColor = existingColor === selectedSurfaceColor 
        ? null 
        : selectedSurfaceColor;

      const updatedTooth: ToothData = {
        ...current,
        surfaces: {
          ...current.surfaces,
          [surface]: nextColor,
        },
      };

      const nextOdontogram = {
        ...prev,
        [tooth]: updatedTooth,
      };

      syncOdontogramToSoap(nextOdontogram);
      return nextOdontogram;
    });
  };

  const handleToothConditionClick = (tooth: number) => {
    if (previewEncounter) return;
    setActiveToothModal(tooth);
    setSelectedGeneralCondition(odontogram[tooth]?.generalCondition || 'normal');
    setToothNoteInput(odontogram[tooth]?.notes || '');
  };

  const saveToothModal = () => {
    if (activeToothModal === null) return;
    setOdontogram((prev) => {
      const current = prev[activeToothModal] || {
        generalCondition: 'normal',
        surfaces: { occlusal: null, mesial: null, distal: null, buccal: null, lingual: null },
      };

      const updatedTooth: ToothData = {
        ...current,
        generalCondition: selectedGeneralCondition,
        notes: toothNoteInput,
      };

      const nextOdontogram = {
        ...prev,
        [activeToothModal]: updatedTooth,
      };

      syncOdontogramToSoap(nextOdontogram);
      return nextOdontogram;
    });
    setActiveToothModal(null);
  };

  const toggleTreatment = (treatment: Treatment) => {
    if (selectedTreatments.some((t) => t.id === treatment.id)) {
      setSelectedTreatments(selectedTreatments.filter((t) => t.id !== treatment.id));
    } else {
      setSelectedTreatments([...selectedTreatments, treatment]);
    }
  };

  const triggerCallToTV = () => {
    if (!selectedPatient) return;
    setIsCallingTV(true);
    const payload = {
      queueNumber: selectedPatient.queueNumber,
      patientName: selectedPatient.name,
      roomName: 'Ruang Tindakan 01',
      doctorName: activeDoctorName,
      timestamp: Date.now(),
    };
    localStorage.setItem('yovela_calling_queue', JSON.stringify(payload));
    fetch('/api/queue/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
    setTimeout(() => setIsCallingTV(false), 2200);
  };

  const handleSaveMedicalRecord = async () => {
    if (!selectedPatient?.encounterId) return;

    try {
      const res = await fetch(`/api/encounters/${selectedPatient.encounterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusKunjungan: 'Menunggu Pembayaran',
          subjective,
          objective,
          diagnosisIcd10: diagnosis,
          suggestedTreatments: selectedTreatments.map((t) => t.id),
          prescriptionNotes,
          odontogram,
          dmft: dmftScore,
          dentitionType: dentitionView,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menyimpan rekam medis.');
        return;
      }

      const updatedPatient: PatientRecord = data.patient;
      setPatientList((prev) => prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)));
      setSelectedPatient(updatedPatient);
      setActivePatient(updatedPatient);
      setIsCompleted(true);
      await fetchVisitHistory(updatedPatient.id);
    } catch {
      alert('Gagal terhubung ke server database.');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-full">
      {/* BANNER PASIEN & PENCARIAN */}
      <section className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 shadow-2xs print:hidden w-full">
        <div className="w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#26d4a5]/25 to-[#26d4a5]/10 border border-[#1B4332]/40 flex items-center justify-center text-[#1B4332] font-black text-xs font-mono shrink-0 shadow-2xs">
              {selectedPatient?.queueNumber || 'A-01'}
            </div>

            <div className="min-w-[270px] flex-1 sm:flex-none">
              <CustomSelect
                searchable
                value={selectedPatient?.id || ''}
                onChange={(val) => {
                  const chosen = patientList.find((p) => p.id === val);
                  if (chosen) loadPatientData(chosen);
                }}
                options={filteredPatients.map((p) => ({
                  value: p.id,
                  label: `[${p.queueNumber}] ${p.name} (${p.age} th)`,
                  sublabel: `${p.rmNumber} • ${p.statusKunjungan}`,
                }))}
                placeholder="Pilih pasien pemeriksaan..."
              />
            </div>

            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">
                <AppIcon name="magnifying-glass" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pasien / No. RM..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#1B4332] focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center">
            {selectedPatient?.encounterId && (
              <button
                type="button"
                onClick={() => setShowConsentMediaModal(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer shadow-2xs ${
                  consentSignedBadge
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-[#1B4332]'
                }`}
              >
                <AppIcon name={consentSignedBadge ? 'circle-check' : 'file-invoice'} className={consentSignedBadge ? 'text-emerald-600' : 'text-[#1B4332]'} />
                <span>Consent &amp; Foto{mediaCountBadge > 0 ? ` (${mediaCountBadge})` : ''}</span>
              </button>
            )}

            <button
              type="button"
              onClick={triggerCallToTV}
              disabled={isCallingTV}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition duration-150 cursor-pointer shadow-2xs ${
                isCallingTV
                  ? 'bg-amber-500 border-amber-600 text-white animate-pulse'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-[#1B4332]'
              }`}
            >
              <AppIcon name={isCallingTV ? "volume-high" : "bullhorn"} className="text-[#1B4332] text-[11px]" />
              <span className="hidden sm:inline">{isCallingTV ? 'Memanggil...' : 'Panggil TV'}</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 text-xs font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-400">DMF-T:</span>
              <strong className="text-[#1B4332] font-black text-sm">{dmftScore.total}</strong>
              <span className="text-slate-300">|</span>
              <span className="text-[10px] text-rose-600 font-bold">D:{dmftScore.d}</span>
              <span className="text-[10px] text-slate-700 font-bold">M:{dmftScore.m}</span>
              <span className="text-[10px] text-[#1B4332] font-bold">F:{dmftScore.f}</span>
            </div>
          </div>
        </div>
      </section>

      {/* WORKSPACE UTAMA */}
      <main className="w-full px-6 py-5 flex-1 print:hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          
          {/* ODONTOGRAM */}
          <section className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 flex flex-col">
            <div className="pb-3 border-b border-slate-100 bg-white space-y-2.5">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#1B4332]/10 text-[#2D6A4F] flex items-center justify-center text-xs shadow-2xs">
                    <AppIcon name="tooth" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs leading-tight">Papan Odontogram Digital FDI</h3>
                    <p className="text-[10px] text-slate-400">Inspeksi anatomi gigi & kondisi patologis</p>
                  </div>
                </div>

                <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-semibold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setDentitionView('adult')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      dentitionView === 'adult' ? 'bg-white text-[#1B4332] font-bold shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Dewasa (32)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDentitionView('deciduous')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      dentitionView === 'deciduous' ? 'bg-white text-[#1B4332] font-bold shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Gigi Susu (20)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDentitionView('mixed')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      dentitionView === 'mixed' ? 'bg-white text-[#1B4332] font-bold shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Campuran
                  </button>
                </div>
              </div>

              <div className="bg-slate-50/90 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs grid grid-cols-5 gap-1.5">
                {[
                  { id: 'caries', label: 'Karies', color: 'bg-rose-500 text-white hover:bg-rose-600' },
                  { id: 'composite', label: 'Komposit', color: 'bg-[#1B4332] text-[#FAF7F0] font-bold hover:bg-[#2D6A4F]' },
                  { id: 'amalgam', label: 'Amalgam', color: 'bg-slate-600 text-white hover:bg-slate-700' },
                  { id: 'gic', label: 'GIC / Sealant', color: 'bg-emerald-600 text-white hover:bg-emerald-700' },
                  { id: 'temporary', label: 'Sementara', color: 'bg-amber-500 text-white hover:bg-amber-600' },
                ].map((tool) => {
                  const isSelected = selectedSurfaceColor === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setSelectedSurfaceColor(tool.id)}
                      className={`w-full py-1.5 text-[10px] font-semibold rounded-xl text-center whitespace-nowrap cursor-pointer transition-all duration-150 flex items-center justify-center gap-1 ${
                        tool.color
                      } ${
                        isSelected
                          ? 'ring-2 ring-[#1B4332] ring-offset-1 scale-105 shadow-sm font-bold'
                          : 'opacity-90 hover:opacity-100 hover:-translate-y-0.5'
                      }`}
                    >
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-slate-500 pt-0.5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-xs" /> Karies</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1B4332] rounded-xs" /> Komposit</span>
                  <span className="flex items-center gap-1"><strong className="text-rose-600 font-bold">X</strong> Missing</span>
                  <span className="flex items-center gap-1"><strong className="text-amber-600 font-bold">R</strong> Radix</span>
                </div>
                <span className="text-[#1B4332] font-semibold text-[9px]">*Klik warna yang sama untuk menghapus</span>
              </div>
            </div>

            {previewEncounter && (
              <div className="mt-3 px-3.5 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-semibold">
                  <AppIcon name="clock-rotate-left" className="text-amber-600" />
                  <span>
                    Pratinjau Riwayat Kunjungan <strong>{previewEncounter.visitDate}</strong> ({previewEncounter.queueNumber}) — Read-only
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewEncounter(null)}
                  className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition cursor-pointer"
                >
                  Kembali ke Kunjungan Aktif
                </button>
              </div>
            )}

            <div className="overflow-x-auto p-4 bg-slate-50/60 rounded-2xl border border-slate-200 shadow-inner mt-3">
              <div className="min-w-[580px] space-y-4">
                {(dentitionView === 'adult' || dentitionView === 'mixed') && (
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase px-2 mb-1">
                      <span>Kanan Pasien (Q1 • Distal ← → Mesial)</span>
                      <span>RAHANG ATAS PERMANEN (MAXILLA)</span>
                      <span>Kiri Pasien (Q2 • Mesial ← → Distal)</span>
                    </div>
                    <div className="flex justify-center border-b border-dashed border-slate-200 pb-3">
                      <div className="flex border-r-2 border-slate-300 pr-2">
                        {q1.map((num) => (
                          <Tooth key={num} toothNumber={num} data={activeBoardOdontogram[num]} onSurfaceClick={handleSurfaceClick} onToothConditionClick={handleToothConditionClick} />
                        ))}
                      </div>
                      <div className="flex pl-2">
                        {q2.map((num) => (
                          <Tooth key={num} toothNumber={num} data={activeBoardOdontogram[num]} onSurfaceClick={handleSurfaceClick} onToothConditionClick={handleToothConditionClick} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(dentitionView === 'deciduous' || dentitionView === 'mixed') && (
                  <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/60 space-y-2.5">
                    <p className="text-center text-[10px] font-bold text-amber-800 tracking-wider uppercase">DENTISI GIGI SUSU (DECIDUOUS)</p>
                    <div className="flex justify-center border-b border-amber-200 pb-2">
                      <div className="flex border-r-2 border-amber-300 pr-2">
                        {q5.map((num) => (
                          <Tooth key={num} toothNumber={num} isDeciduous data={activeBoardOdontogram[num]} onSurfaceClick={handleSurfaceClick} onToothConditionClick={handleToothConditionClick} />
                        ))}
                      </div>
                      <div className="flex pl-2">
                        {q6.map((num) => (
                          <Tooth key={num} toothNumber={num} isDeciduous data={activeBoardOdontogram[num]} onSurfaceClick={handleSurfaceClick} onToothConditionClick={handleToothConditionClick} />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-center pt-1">
                      <div className="flex border-r-2 border-amber-300 pr-2">
                        {q8.map((num) => (
                          <Tooth key={num} toothNumber={num} isDeciduous data={activeBoardOdontogram[num]} onSurfaceClick={handleSurfaceClick} onToothConditionClick={handleToothConditionClick} />
                        ))}
                      </div>
                      <div className="flex pl-2">
                        {q7.map((num) => (
                          <Tooth key={num} toothNumber={num} isDeciduous data={activeBoardOdontogram[num]} onSurfaceClick={handleSurfaceClick} onToothConditionClick={handleToothConditionClick} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(dentitionView === 'adult' || dentitionView === 'mixed') && (
                  <div>
                    <div className="flex justify-center pt-2">
                      <div className="flex border-r-2 border-slate-300 pr-2">
                        {q4.map((num) => (
                          <Tooth key={num} toothNumber={num} data={activeBoardOdontogram[num]} onSurfaceClick={handleSurfaceClick} onToothConditionClick={handleToothConditionClick} />
                        ))}
                      </div>
                      <div className="flex pl-2">
                        {q3.map((num) => (
                          <Tooth key={num} toothNumber={num} data={activeBoardOdontogram[num]} onSurfaceClick={handleSurfaceClick} onToothConditionClick={handleToothConditionClick} />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase px-2 mt-2">
                      <span>Kanan Pasien (Q4 • Distal ← → Mesial)</span>
                      <span>RAHANG BAWAH PERMANEN (MANDIBULA)</span>
                      <span>Kiri Pasien (Q3 • Mesial ← → Distal)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SOAP & BILLING */}
          <section className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 flex flex-col">
            <div className="pb-3 border-b border-slate-100 bg-white">
              <div className="grid grid-cols-4 bg-slate-100 p-1 rounded-2xl text-[11px] font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('soap')}
                  className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                    activeTab === 'soap' ? 'bg-white text-[#1B4332] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <AppIcon name="notes-medical" className="text-[10px]" />
                  <span>SOAP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                    activeTab === 'billing' ? 'bg-white text-[#1B4332] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <AppIcon name="receipt" className="text-[10px]" />
                  <span>Tindakan ({selectedTreatments.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                    activeTab === 'history' ? 'bg-white text-[#1B4332] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <AppIcon name="pills" className="text-[10px]" />
                  <span>E-Resep</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('visits')}
                  className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                    activeTab === 'visits' ? 'bg-white text-[#1B4332] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <AppIcon name="clock-rotate-left" className="text-[10px]" />
                  <span>Riwayat ({visitHistory.length})</span>
                </button>
              </div>
            </div>

            <div className="py-3 space-y-3.5 text-xs">
              {activeTab === 'soap' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Subjective (Keluhan Pasien):</label>
                    <textarea
                      value={subjective}
                      onChange={(e) => setSubjective(e.target.value)}
                      className="w-full border border-slate-200 rounded-2xl p-2.5 bg-slate-50 text-slate-800 outline-none focus:border-[#1B4332] focus:bg-white transition leading-relaxed"
                      rows={3}
                      placeholder="Anamnesis keluhan utama..."
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Objective (Pemeriksaan Fisik - Sinkron Otomatis):
                    </label>
                    <textarea
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className="w-full border border-slate-200 rounded-2xl p-2.5 bg-slate-50 text-slate-800 outline-none focus:border-[#1B4332] focus:bg-white transition leading-relaxed"
                      rows={4}
                      placeholder="Klik permukaan gigi untuk mengisi otomatis..."
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Assessment (Diagnosis ICD-10):</label>
                    <CustomSelect
                      searchable
                      value={diagnosis}
                      onChange={setDiagnosis}
                      options={DIAGNOSES.map((d) => ({
                        value: d.code,
                        label: `[${d.code}] ${d.name}`,
                        sublabel: d.category,
                      }))}
                      placeholder="Pilih diagnosis ICD-10..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-bold text-slate-700">Katalog Prosedur (ICD-9-CM):</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#1B4332]">{selectedTreatments.length} Dipilih</span>
                      {currentUser?.role === 'DOKTER' && (
                        <button
                          type="button"
                          onClick={() => {
                            setTariffMsg('');
                            setShowTariffModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold cursor-pointer transition"
                        >
                          Kelola Tarif
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                    {treatmentCatalog.map((treatment) => {
                      const isChecked = selectedTreatments.some((t) => t.id === treatment.id);
                      return (
                        <div
                          key={treatment.id}
                          onClick={() => toggleTreatment(treatment)}
                          className={`flex justify-between items-center p-2.5 rounded-2xl cursor-pointer transition border text-xs ${
                            isChecked
                              ? 'bg-[#1B4332]/10 border-[#1B4332] text-slate-900 font-bold shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <p>{treatment.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono">ICD-9: {treatment.icd9cm}</p>
                          </div>
                          <span className="font-mono font-bold text-slate-800 shrink-0 ml-2">
                            Rp {treatment.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">R/ Instruksi & E-Resep Obat:</label>
                    <textarea
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                      className="w-full border border-slate-200 rounded-2xl p-2.5 bg-slate-50 text-slate-800 outline-none focus:border-[#1B4332] focus:bg-white font-mono leading-relaxed"
                      rows={6}
                    />
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-800 text-[10px] flex items-center gap-2">
                    <AppIcon name="triangle-exclamation" className="text-amber-600" />
                    <span>Periksa alergi obat pasien sebelum meresepkan analgesik atau antibiotik.</span>
                  </div>
                </div>
              )}

              {activeTab === 'visits' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Riwayat Kunjungan Multi-Visit ({visitHistory.length})</span>
                    {previewEncounter && (
                      <button
                        type="button"
                        onClick={() => setPreviewEncounter(null)}
                        className="text-[10px] font-bold text-amber-700 underline cursor-pointer"
                      >
                        Tutup Pratinjau
                      </button>
                    )}
                  </div>

                  {isLoadingHistory ? (
                    <div className="p-8 text-center text-slate-400 text-xs">Memuat riwayat kunjungan dari database...</div>
                  ) : visitHistory.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">Belum ada riwayat kunjungan tercatat.</div>
                  ) : (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {visitHistory.map((enc, idx) => {
                        const isPreviewing = previewEncounter?.id === enc.id;
                        const isCurrent = selectedPatient?.encounterId === enc.id;
                        return (
                          <div
                            key={enc.id}
                            className={`p-3 rounded-2xl border space-y-1.5 transition ${
                              isPreviewing
                                ? 'bg-amber-50/80 border-amber-400 shadow-xs'
                                : isCurrent
                                ? 'bg-[#1B4332]/10 border-[#1B4332]/50'
                                : 'bg-slate-50/70 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-900">{enc.visitDate}</span>
                                <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10px] text-[#1B4332] font-bold">
                                  {enc.queueNumber}
                                </span>
                                {idx === 0 && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-[#1B4332]/15 text-[#1B4332] text-[9px] font-bold">
                                    Terbaru
                                  </span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white border border-slate-200 text-slate-600">
                                {enc.statusKunjungan}
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-500">
                              Dokter: <strong className="text-slate-700">{enc.doctorName}</strong> • ICD-10:{' '}
                              <strong className="font-mono text-slate-800">{enc.diagnosisIcd10}</strong> • DMF-T:{' '}
                              <strong className="font-mono text-[#1B4332]">{enc.dmft.total}</strong>
                            </p>

                            {enc.subjective && (
                              <p className="text-[11px] text-slate-700 leading-snug">
                                <strong>S:</strong> {enc.subjective}
                              </p>
                            )}
                            {enc.objective && (
                              <p className="text-[11px] text-slate-600 leading-snug">
                                <strong>O:</strong> {enc.objective}
                              </p>
                            )}
                            {enc.prescriptionNotes && (
                              <p className="text-[10px] text-slate-500 font-mono bg-white/80 p-1.5 rounded-lg border border-slate-200/70">
                                R/ {enc.prescriptionNotes}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1">
                              {enc.invoice ? (
                                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                                  {enc.invoice.invoiceNo} • Rp {enc.invoice.amount.toLocaleString('id-ID')} ({enc.invoice.paymentMethod})
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Belum ada invoice lunas</span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (isPreviewing) {
                                    setPreviewEncounter(null);
                                  } else {
                                    setPreviewEncounter(enc);
                                    setDentitionView(enc.dentitionType || 'adult');
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                  isPreviewing
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-white border border-slate-200 hover:border-[#1B4332] text-slate-700 hover:text-[#1B4332]'
                                }`}
                              >
                                <AppIcon name="tooth" className="mr-1" />
                                {isPreviewing ? 'Tutup Pratinjau' : 'Tinjau Odontogram'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2.5 bg-white">
              <div className="flex justify-between items-baseline bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600">Total Tagihan:</span>
                <span className="text-lg font-black font-mono text-[#1B4332]">
                  Rp {totalBilling.toLocaleString('id-ID')}
                </span>
              </div>

              {!isCompleted ? (
                <button
                  type="button"
                  onClick={handleSaveMedicalRecord}
                  className="w-full bg-[#E63946] hover:bg-[#D62828] text-white font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition text-xs cursor-pointer active:scale-98"
                >
                  <AppIcon name="floppy-disk" /> Simpan Rekam Medis Pasien
                </button>
              ) : (
                <div className="space-y-1.5">
                  <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
                    <AppIcon name="check" className="text-emerald-600 mr-1" /> Rekam Medis Selesai & Terkirim ke Kasir
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer shadow-sm"
                  >
                    <AppIcon name="print" /> Cetak Struk Kasir Termal 80mm
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>

      {/* MODAL ANOTASI GIGI */}
      {activeToothModal !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AppIcon name="tooth" className="text-[#2D6A4F]" />
                Kondisi Gigi #{activeToothModal}
              </h3>
              <button 
                type="button"
                onClick={() => setActiveToothModal(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <AppIcon name="xmark" className="text-sm" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'normal', label: 'Normal / Erupsi' },
                  { id: 'missing', label: 'Missing / Hilang (X)' },
                  { id: 'radix', label: 'Radix / Sisa Akar (R)' },
                  { id: 'impacted', label: 'Impaksi / Tertanam' },
                  { id: 'rct', label: 'PSA / Endodontik' },
                  { id: 'full_crown', label: 'Mahkota / Crown' },
                ].map((cond) => (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => setSelectedGeneralCondition(cond.id as GeneralToothCondition)}
                    className={`p-2 rounded-xl border text-left font-semibold transition cursor-pointer ${
                      selectedGeneralCondition === cond.id ? 'border-[#1B4332] bg-[#1B4332]/10 font-bold' : 'border-slate-200'
                    }`}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan Gigi #{activeToothModal}:</label>
                <textarea
                  value={toothNoteInput}
                  onChange={(e) => setToothNoteInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-800 outline-none focus:border-[#1B4332]"
                  rows={3}
                  placeholder="Contoh: Sondasi ngilu, perkusi (+)..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button 
                type="button"
                onClick={() => setActiveToothModal(null)} 
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={saveToothModal} 
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#E63946] hover:bg-[#D62828] text-white cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KELOLA MASTER TARIF TINDAKAN (KHUSUS DOKTER) */}
      {showTariffModal && currentUser?.role === 'DOKTER' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Master Tarif Tindakan Klinik (Database Prisma)</h3>
                <p className="text-[10px] text-slate-400">Perubahan tarif langsung berlaku di Poli dan Kasir</p>
              </div>
              <button type="button" onClick={() => setShowTariffModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <AppIcon name="xmark" className="w-4 h-4" />
              </button>
            </div>

            {tariffMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px]">
                {tariffMsg}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newTariffName.trim() || typeof newTariffPrice !== 'number' || newTariffPrice <= 0) return;
                const res = await fetch('/api/treatments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: newTariffName.trim(),
                    category: newTariffCategory,
                    icd9cm: newTariffIcd9.trim() || '89.31',
                    price: newTariffPrice,
                  }),
                });
                if (res.ok) {
                  setNewTariffName('');
                  setNewTariffPrice('');
                  await refreshTreatments();
                  setTariffMsg('Tindakan baru berhasil ditambahkan ke database!');
                }
              }}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
            >
              <p className="font-bold text-slate-700">Tambah Tindakan Baru:</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nama tindakan..."
                  value={newTariffName}
                  onChange={(e) => setNewTariffName(e.target.value)}
                  className="sm:col-span-2 p-2 rounded-xl border border-slate-200 bg-white"
                />
                <input
                  type="number"
                  required
                  min={1000}
                  placeholder="Tarif (Rp)"
                  value={newTariffPrice}
                  onChange={(e) => setNewTariffPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="p-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
                <button type="submit" className="p-2 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white font-bold cursor-pointer">
                  + Tambah
                </button>
              </div>
            </form>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {treatmentCatalog.map((item) => (
                <div key={item.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.id} • ICD-9: {item.icd9cm}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      defaultValue={item.price}
                      onBlur={async (e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val) && val > 0 && val !== item.price) {
                          const res = await fetch('/api/treatments', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: item.id, price: val }),
                          });
                          if (res.ok) {
                            await refreshTreatments();
                            setTariffMsg(`Tarif ${item.id} diperbarui menjadi Rp ${val.toLocaleString('id-ID')}.`);
                          }
                        }
                      }}
                      className="w-28 p-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-right"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL INFORMED CONSENT DIGITAL & FOTO INTRAORAL / RONTGEN */}
      {selectedPatient?.encounterId && (
        <ConsentMediaModal
          isOpen={showConsentMediaModal}
          onClose={() => setShowConsentMediaModal(false)}
          encounterId={selectedPatient.encounterId}
          patientName={selectedPatient.name}
          rmNumber={selectedPatient.rmNumber}
          defaultProcedure={selectedTreatments.map((t) => t.name).join(', ') || 'Tindakan Kedokteran Gigi'}
          doctorName={activeDoctorName}
          onStatusChange={(signed, count) => {
            setConsentSignedBadge(signed);
            setMediaCountBadge(count);
          }}
        />
      )}

      {/* STRUK KASIR */}
      {selectedPatient && (
        <InvoiceReceipt
          invoiceData={{
            invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${selectedPatient.queueNumber}`,
            patientName: selectedPatient.name,
            rmNumber: selectedPatient.rmNumber,
            doctorName: `${activeDoctorName} (${activeDoctorLabel})`,
            treatments: selectedTreatments,
            total: totalBilling,
          }}
        />
      )}
    </div>
  );
}