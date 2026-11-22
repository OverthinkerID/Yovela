import { ToothData } from '../components/Odontogram';

export interface Treatment {
  id: string;
  category:
    | 'Pemeriksaan & Preventif'
    | 'Konservasi & Endodontik'
    | 'Bedah Mulut'
    | 'Periodonsia'
    | 'Ortodonti'
    | 'Prostodonsia & Estetika'
    | 'Pedodonsia (Gigi Anak)';
  name: string;
  price: number;
  icd9cm: string;
  description?: string;
}

export interface Diagnosis {
  code: string;
  name: string;
  category: string;
}

export interface PatientRecord {
  id: string;
  encounterId?: string;
  queueNumber: string;
  name: string;
  rmNumber: string;
  nik: string;
  birthDate?: string;
  age: number;
  gender: 'Laki-laki' | 'Perempuan';
  phone: string;
  address: string;
  allergies: string;
  registrationDate: string;
  statusKunjungan: 'Menunggu' | 'Sedang Diperiksa' | 'Menunggu Pembayaran' | 'Selesai';
  registeredBy?: string;
  initialOdontogram?: Record<number, ToothData>;
  lastSoap?: {
    subjective: string;
    objective: string;
    diagnosisIcd10: string;
    suggestedTreatments?: string[];
    prescriptionNotes?: string;
  };
}

