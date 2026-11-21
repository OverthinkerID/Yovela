import { PatientRecord } from '../data/patientDatabase';

export interface PatientWithEncounterRecord extends PatientRecord {
  encounterId: string;
}

export function serializePatientWithEncounter(patient: any): PatientWithEncounterRecord {
  const latestEncounter = patient.encounters?.[0];
  let suggestedTreatments: string[] = ['TRT-001'];
  if (latestEncounter?.suggestedTreatmentsJson) {
    try {
      const parsed = JSON.parse(latestEncounter.suggestedTreatmentsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        suggestedTreatments = parsed;
      }
    } catch {}
  }

  let initialOdontogram: Record<number, any> = {};
  if (latestEncounter?.odontogram?.teethJson) {
    try {
      initialOdontogram = JSON.parse(latestEncounter.odontogram.teethJson);
    } catch {}
  }

  return {
    id: patient.id,
    encounterId: latestEncounter?.id || '',
    queueNumber: latestEncounter?.queueNumber || 'A-00',
    name: patient.name,
    rmNumber: patient.rmNumber,
    nik: patient.nik || '',
    birthDate: patient.birthDate || undefined,
    age: patient.age,
    gender: patient.gender as 'Laki-laki' | 'Perempuan',
    phone: patient.phone,
    address: patient.address || '',
    allergies: patient.allergies || 'Tidak Ada',
    registrationDate: latestEncounter?.visitDate || new Date().toISOString().slice(0, 10),
    statusKunjungan: (latestEncounter?.statusKunjungan || 'Menunggu') as PatientRecord['statusKunjungan'],
    registeredBy: latestEncounter?.registeredBy || patient.registeredBy || undefined,
    initialOdontogram,
    lastSoap: latestEncounter
      ? {
          subjective: latestEncounter.subjective || '',
          objective: latestEncounter.objective || '',
          diagnosisIcd10: latestEncounter.diagnosisIcd10 || 'K02.1',
          suggestedTreatments,
          prescriptionNotes: latestEncounter.prescriptionNotes || '',
        }
      : undefined,
  };
}
