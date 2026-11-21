import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { TREATMENTS } from '../src/data/mockData';
import { INITIAL_PATIENTS } from '../src/data/patientDatabase';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Yovela Dental Clinic database...');

  // 1. Seed Users (dengan password ter-hash bcrypt)
  const defaultUsers = [
    {
      username: 'yulipanjaitan',
      pass: 'admin123',
      name: 'drg. Yuli Kartilla Panjaitan',
      role: 'DOKTER',
      roleLabel: 'Dokter Gigi Umum & Penanggung Jawab',
      sipNumber: 'SIP.503/449/DRG/2026',
      ihsPractitionerId: '10008921821',
    },
    {
      username: 'pendaftaran',
      pass: 'fo123',
      name: 'Budi Santoso, A.Md.Kes',
      role: 'PENDAFTARAN',
      roleLabel: 'Petugas Front Office & Registrasi',
    },
    {
      username: 'kasir',
      pass: 'kasir123',
      name: 'Siti Rahma, S.E.',
      role: 'KASIR',
      roleLabel: 'Staf Kasir & Billing',
    },
  ];

  let doctorUserId: string | null = null;
  for (const u of defaultUsers) {
    const passwordHash = await bcrypt.hash(u.pass, 10);
    const saved = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        name: u.name,
        role: u.role,
        roleLabel: u.roleLabel,
        sipNumber: u.sipNumber,
        ihsPractitionerId: u.ihsPractitionerId,
      },
      create: {
        username: u.username,
        passwordHash,
        name: u.name,
        role: u.role,
        roleLabel: u.roleLabel,
        sipNumber: u.sipNumber,
        ihsPractitionerId: u.ihsPractitionerId,
      },
    });
    if (u.role === 'DOKTER') {
      doctorUserId = saved.id;
    }
  }

  // 2. Seed Master Treatments (TRT-001 .. TRT-030)
  for (const t of TREATMENTS) {
    await prisma.treatment.upsert({
      where: { id: t.id },
      update: {
        category: t.category,
        name: t.name,
        price: t.price,
        icd9cm: t.icd9cm,
        description: t.description ?? null,
      },
      create: {
        id: t.id,
        category: t.category,
        name: t.name,
        price: t.price,
        icd9cm: t.icd9cm,
        description: t.description ?? null,
      },
    });
  }

  // 3. Seed Initial Patients, Encounters, and Odontograms
  for (const p of INITIAL_PATIENTS) {
    const existingPatient = await prisma.patient.findUnique({
      where: { rmNumber: p.rmNumber },
    });

    if (!existingPatient) {
      const createdPatient = await prisma.patient.create({
        data: {
          rmNumber: p.rmNumber,
          nik: p.nik,
          name: p.name,
          birthDate: p.birthDate ?? null,
          age: p.age,
          gender: p.gender,
          phone: p.phone,
          address: p.address,
          allergies: p.allergies,
          registeredBy: p.registeredBy ?? null,
        },
      });

      const createdEncounter = await prisma.encounter.create({
        data: {
          patientId: createdPatient.id,
          doctorId: doctorUserId,
          visitDate: p.registrationDate,
          queueNumber: p.queueNumber,
          statusKunjungan: p.statusKunjungan,
          subjective: p.lastSoap?.subjective ?? '',
          objective: p.lastSoap?.objective ?? '',
          diagnosisIcd10: p.lastSoap?.diagnosisIcd10 ?? 'K02.1',
          suggestedTreatmentsJson: JSON.stringify(p.lastSoap?.suggestedTreatments ?? ['TRT-001']),
          prescriptionNotes: p.lastSoap?.prescriptionNotes ?? '',
          registeredBy: p.registeredBy ?? null,
        },
      });

      await prisma.odontogramRecord.create({
        data: {
          encounterId: createdEncounter.id,
          patientId: createdPatient.id,
          dentitionType: p.age <= 12 ? 'mixed' : 'adult',
          teethJson: JSON.stringify(p.initialOdontogram ?? {}),
        },
      });
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
