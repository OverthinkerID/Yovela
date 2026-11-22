'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppIcon } from "@/components/AppIcon";
import Link from 'next/link';
import { PatientRecord, Treatment } from '../../../types/clinic';
import { DIAGNOSES } from '../../../lib/data/clinicalCatalog';
import { useAuth } from '../../../context/AuthContext';

interface SyncLog {
  id: string;
  timestamp: string;
  patientName: string;
  nik: string;
  resourceType: 'Encounter' | 'Condition' | 'Procedure' | 'Bundle';
  resourceId: string;
  status: '201 Created' | '200 OK' | 'Failed';
  rawPayload: any;
}

export default function SatuSehatIntegrationPage() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [activeJsonTab, setActiveJsonTab] = useState<'Encounter' | 'Condition' | 'Procedure'>('Encounter');
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  // Identitas Fasilitas Pelayanan Kesehatan (Faskes) SATUSEHAT
  const faskesConfig = {
    organizationId: '100024951', // ID Organisasi Kemenkes Yovela Dental
    locationId: 'loc-poli-gigi-01',
    doctorIhsNumber: '10008921821', // drg. Yuli Kartilla Panjaitan IHS
    clinicName: 'Yovela Dental Clinic',
    fhirEndpoint: 'https://api-satusehat.kemkes.go.id/fhir-r4/v1',
  };

  useEffect(() => {
    const loadSatuSehat = async () => {
      try {
        const [pRes, lRes, tRes] = await Promise.all([
          fetch('/api/patients', { cache: 'no-store' }),
          fetch('/api/satusehat', { cache: 'no-store' }),
          fetch('/api/treatments', { cache: 'no-store' }),
        ]);
        if (pRes.ok) {
          const pData = await pRes.json();
          const list: PatientRecord[] = pData.patients || [];
          setPatients(list);
          if (list.length > 0) setSelectedPatientId(list[0].id);
        }
        if (lRes.ok) {
          const lData = await lRes.json();
          setSyncLogs(lData.logs || []);
        }
        if (tRes.ok) {
          const tData = await tRes.json();
          setTreatments(tData.treatments || []);
        }
      } catch (err) {
        console.error('Gagal memuat data SATUSEHAT:', err);
      }
    };
    loadSatuSehat();
  }, []);

  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // Generate FHIR Resources Bundle untuk Pasien Terpilih
  const fhirPayload = useMemo(() => {
    if (!activePatient) return null;

    const encounterId = `enc-${activePatient.rmNumber.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const conditionCode = activePatient.lastSoap?.diagnosisIcd10 || 'K02.1';
    const conditionMeta = DIAGNOSES.find((d) => d.code === conditionCode) || DIAGNOSES[0];
    const treatmentId = activePatient.lastSoap?.suggestedTreatments?.[0] || 'TRT-001';
    const treatmentMeta = treatments.find((t) => t.id === treatmentId) || {
      id: treatmentId,
      name: 'Pemeriksaan & Tindakan Gigi',
      icd9cm: '89.31',
      price: 0,
      category: 'Pemeriksaan & Preventif',
    };

    return {
      Encounter: {
        resourceType: 'Encounter',
        id: encounterId,
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'Ambulatory / Rawat Jalan',
        },
        subject: {
          reference: `Patient/${activePatient.nik}`,
          display: activePatient.name,
        },
        participant: [
          {
            type: [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                    code: 'ATND',
                    display: 'attender',
                  },
                ],
              },
            ],
            individual: {
              reference: `Practitioner/${faskesConfig.doctorIhsNumber}`,
              display: 'drg. Yuli Kartilla Panjaitan',
            },
          },
        ],
        serviceProvider: {
          reference: `Organization/${faskesConfig.organizationId}`,
          display: faskesConfig.clinicName,
        },
      },
      Condition: {
        resourceType: 'Condition',
        clinicalStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
              code: 'active',
              display: 'Active',
            },
          ],
        },
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                code: 'encounter-diagnosis',
                display: 'Encounter Diagnosis',
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: 'http://hl7.org/fhir/sid/icd-10',
              code: conditionMeta.code,
              display: conditionMeta.name,
            },
          ],
        },
        subject: {
          reference: `Patient/${activePatient.nik}`,
          display: activePatient.name,
        },
        encounter: {
          reference: `Encounter/${encounterId}`,
        },
      },
      Procedure: {
        resourceType: 'Procedure',
        status: 'completed',
        category: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '387713003',
              display: 'Surgical procedure / Tindakan Gigi',
            },
          ],
        },
        code: {
          coding: [
            {
              system: 'http://hl7.org/fhir/sid/icd-9-cm',
              code: treatmentMeta.icd9cm,
              display: treatmentMeta.name,
            },
          ],
        },
        subject: {
          reference: `Patient/${activePatient.nik}`,
          display: activePatient.name,
        },
        encounter: {
          reference: `Encounter/${encounterId}`,
        },
      },
    };
  }, [activePatient, treatments]);

  // Kirim Sinkronisasi Data ke SATUSEHAT via API Prisma
  const handleSyncPatient = async (patient: PatientRecord) => {
    if (!patient.encounterId) return;
    setSyncingId(patient.id);

    try {
      const res = await fetch('/api/satusehat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounterId: patient.encounterId }),
      });
      const data = await res.json();
      if (res.ok && data.log) {
        setSyncLogs((prev) => [data.log, ...prev]);
        setToastMessage(`Berhasil mencatat sinkronisasi ${patient.name} ke database SATUSEHAT! (${data.log.status})`);
      } else {
        setToastMessage(data.error || 'Gagal mencatat sinkronisasi SATUSEHAT.');
      }
    } catch {
      setToastMessage('Gagal terhubung ke server database.');
    } finally {
      setSyncingId(null);
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.rmNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nik.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-slate-800 font-['Poppins',sans-serif] flex flex-col antialiased pb-12">
      {/* 1. SUB-BAR STATUS SATUSEHAT (Tanpa Double Header) */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-3">
        <div className="max-w-[1440px] w-full mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900">Bridging SATUSEHAT Kemenkes RI</h1>
            <p className="text-[10px] text-slate-400 font-medium">Gateway Integrasi FHIR R4 • Pratinjau Resource & Log Transmisi</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-800 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Mode Simulasi Lokal (Butuh Backend OAuth2)</span>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFIKASI */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700 text-xs font-semibold">
          <div className="w-6 h-6 rounded-full bg-[#1B4332] text-[#FAF7F0] flex items-center justify-center text-xs">
            <AppIcon name="check" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. SUB-BANNER STATUS KONEKSI FASKES */}
      <section className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-3.5 shadow-2xs">
        <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <AppIcon name="hospital" className="text-xs" />
            </div>
            <div className="truncate">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Organization ID</span>
              <strong className="text-slate-800 font-mono">{faskesConfig.organizationId}</strong>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <AppIcon name="user-doctor" className="text-xs" />
            </div>
            <div className="truncate">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Practitioner IHS ID</span>
              <strong className="text-slate-800 font-mono">{faskesConfig.doctorIhsNumber}</strong>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
              <AppIcon name="shield-halved" className="text-xs" />
            </div>
            <div className="truncate">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Protokol Keamanan</span>
              <strong className="text-slate-800">OAuth 2.0 Client Credentials</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WORKSPACE KONTEN UTAMA */}
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* KOLOM KIRI (6 Kolom): Daftar Pasien & Antrean Kirim FHIR */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Rekam Medis Pasien Siap Sinkron</h2>
                  <p className="text-[11px] text-slate-400">Pilih pasien untuk meninjau struktur JSON FHIR</p>
                </div>

                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    placeholder="Cari Pasien, NIK..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1B4332] focus:bg-white transition"
                  />
                  <AppIcon name="magnifying-glass" className="text-slate-400 text-xs absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* List Pasien */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredPatients.map((patient) => {
                  const isSelected = selectedPatientId === patient.id;
                  const isSyncing = syncingId === patient.id;

                  return (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`p-3.5 rounded-2xl border transition duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#1B4332]/10 border-[#1B4332] shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                          isSelected ? 'bg-[#1B4332] text-[#FAF7F0]' : 'bg-white text-[#1B4332] border border-slate-200'
                        }`}>
                          {patient.queueNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{patient.name}</h4>
                            <span className="text-[10px] text-slate-500 font-mono">({patient.nik})</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            ICD-10: {patient.lastSoap?.diagnosisIcd10 || 'K02.1'} • {patient.rmNumber}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSyncPatient(patient);
                        }}
                        disabled={isSyncing}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          isSyncing
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-[#1B4332] hover:text-[#1B4332]'
                        }`}
                      >
                        <AppIcon name={isSyncing ? "spinner" : "cloud-arrow-up"} className={isSyncing ? "animate-spin text-xs" : "text-xs"} />
                        <span>{isSyncing ? 'Kirim...' : 'Kirim'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (6 Kolom): Pratinjau JSON Payload FHIR R4 */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">FHIR R4 Resource Previewer</h3>
                  <p className="text-[10px] text-slate-400">
                    Pasien Aktif: <strong className="text-slate-800">{activePatient?.name}</strong>
                  </p>
                </div>

                {/* Tab Pilihan Resource FHIR */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
                  {(['Encounter', 'Condition', 'Procedure'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveJsonTab(tab)}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        activeJsonTab === tab
                          ? 'bg-white text-[#1B4332] shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kotak Tampilan JSON Interaktif */}
              <div className="bg-slate-950 rounded-2xl p-4 overflow-x-auto shadow-inner text-[11px] font-mono leading-relaxed text-slate-200 border border-slate-800 max-h-[360px] overflow-y-auto scrollbar-thin">
                <pre className="text-emerald-400">
                  {JSON.stringify(fhirPayload?.[activeJsonTab] || {}, null, 2)}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <AppIcon name="code" className="text-[#1B4332]" />
                  <span>HL7 FHIR Release 4 • JSON Payload</span>
                </span>

                {activePatient && (
                  <button
                    type="button"
                    onClick={() => handleSyncPatient(activePatient)}
                    className="px-4 py-2 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <AppIcon name="paper-plane" className="text-xs" />
                    <span>Sinkronkan Bundle Pasien Ini</span>
                  </button>
                )}
              </div>
            </div>

            {/* Riwayat Log Sinkronisasi */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <AppIcon name="clock-rotate-left" className="text-[#1B4332]" />
                  <span>Log Transmisi API Terakhir</span>
                </h4>
                <span className="text-[10px] text-slate-400">{syncLogs.length} Aktivitas</span>
              </div>

              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 text-xs">
                {syncLogs.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-4">Belum ada transmisi data.</p>
                ) : (
                  syncLogs.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{log.patientName}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">{log.timestamp}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                        {log.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}