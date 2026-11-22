import { prisma } from '../prisma';
import { serializePatientWithEncounter } from '../serializers';
import { DEFAULT_TREATMENTS, DIAGNOSES } from '../data/clinicalCatalog';
import { DEV_SEED_PATIENTS } from '../mocks/mockClinicStore';
import { isMockDataMode } from '../environment';
import { Diagnosis, PatientRecord, Treatment } from '../../types/clinic';

export interface IClinicRepository {
  listPatients(view?: 'all' | 'tv'): Promise<PatientRecord[]>;
  listTreatments(): Promise<Treatment[]>;
  listDiagnoses(): Promise<Diagnosis[]>;
}

export class DatabaseClinicRepository implements IClinicRepository {
  async listPatients(view: 'all' | 'tv' = 'all'): Promise<PatientRecord[]> {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        encounters: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { odontogram: true },
        },
      },
    });

    const serialized = patients.map(serializePatientWithEncounter);
    if (view === 'tv') {
      return serialized.filter(
        (p) => p.statusKunjungan === 'Menunggu' || p.statusKunjungan === 'Sedang Diperiksa'
      );
    }
    return serialized;
  }

  async listTreatments(): Promise<Treatment[]> {
    const rows = await prisma.treatment.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      category: r.category as Treatment['category'],
      name: r.name,
      price: r.price,
      icd9cm: r.icd9cm,
      description: r.description ?? undefined,
    }));
  }

  async listDiagnoses(): Promise<Diagnosis[]> {
    return DIAGNOSES;
  }
}

export class MockClinicRepository implements IClinicRepository {
  private assertMockAllowed() {
    if (!isMockDataMode()) {
      throw new Error(
        '[SECURITY_ERROR] MockClinicRepository tidak boleh diakses di luar mode APP_DATA_MODE=mock.'
      );
    }
  }

  async listPatients(view: 'all' | 'tv' = 'all'): Promise<PatientRecord[]> {
    this.assertMockAllowed();
    if (view === 'tv') {
      return DEV_SEED_PATIENTS.filter(
        (p) => p.statusKunjungan === 'Menunggu' || p.statusKunjungan === 'Sedang Diperiksa'
      );
    }
    return DEV_SEED_PATIENTS;
  }

  async listTreatments(): Promise<Treatment[]> {
    this.assertMockAllowed();
    return DEFAULT_TREATMENTS;
  }

  async listDiagnoses(): Promise<Diagnosis[]> {
    this.assertMockAllowed();
    return DIAGNOSES;
  }
}

