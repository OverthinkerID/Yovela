import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_TREATMENTS } from '../src/lib/data/clinicalCatalog';
import { DEV_SEED_PATIENTS } from '../src/lib/mocks/mockClinicStore';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let val = line.slice(eqIndex + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

// Strict Production Guard — harus berjalan sebelum inisialisasi database
if (
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL === '1' ||
  process.env.VERCEL_ENV === 'production' ||
  process.env.VERCEL_ENV === 'preview'
) {
  console.error(
    '[SECURITY_GUARD] prisma/seed.dev.ts DILARANG dijalankan pada environment production, preview, atau Vercel!'
  );
  process.exit(1);
}

const rootDir = process.cwd();
loadEnvFile(path.join(rootDir, '.env.local'));
loadEnvFile(path.join(rootDir, '.env'));

const prisma = new PrismaClient();

async function main() {
  console.log('[DEV_SEED] Memulai seeding development lokal Yovela Dental Clinic...');

  const devUsers = [
    {
      username: 'yulipanjaitan',
      email: 'admin@yovela.dev.local',
      pass: 'admin123',
      name: 'drg. Yuli Kartilla Panjaitan',
      role: 'DOKTER',
      roleLabel: 'Dokter Gigi Umum & Penanggung Jawab',
      sipNumber: 'SIP.503/449/DRG/2026',
      ihsPractitionerId: '10008921821',
    },
    {
      username: 'dokter2',
      email: 'dokter.praktik@yovela.dev.local',
      pass: 'dokter123',
      name: 'drg. Pratama Wijaya',
      role: 'DOKTER_LAIN',
      roleLabel: 'Dokter Gigi Praktik',
      sipNumber: 'SIP.503/512/DRG/2026',
      ihsPractitionerId: '10008921999',
    },
    {
      username: 'pendaftaran',
      email: 'frontoffice@yovela.dev.local',
      pass: 'fo123',
      name: 'Budi Santoso, A.Md.Kes',
      role: 'PENDAFTARAN',
      roleLabel: 'Petugas Front Office & Registrasi',
    },
    {
      username: 'kasir',
      email: 'kasir@yovela.dev.local',
      pass: 'kasir123',
      name: 'Siti Rahma, S.E.',
      role: 'KASIR',
      roleLabel: 'Staf Kasir & Billing',
    },
  ];

  let mainDoctorId: string | null = null;
  for (const u of devUsers) {
    const passwordHash = await bcrypt.hash(u.pass, 10);
    const saved = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        email: u.email,
        name: u.name,
        role: u.role,
        roleLabel: u.roleLabel,
        sipNumber: u.sipNumber ?? null,
        ihsPractitionerId: u.ihsPractitionerId ?? null,
        isActive: true,
      },
      create: {
        username: u.username,
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        roleLabel: u.roleLabel,
        sipNumber: u.sipNumber ?? null,
        ihsPractitionerId: u.ihsPractitionerId ?? null,
        isActive: true,
      },
    });
    if (u.role === 'DOKTER') {
      mainDoctorId = saved.id;
    }
  }

  for (const t of DEFAULT_TREATMENTS) {
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

  const seededPatients: Array<{ id: string; name: string; rmNumber: string }> = [];
  for (const p of DEV_SEED_PATIENTS) {
    let patient = await prisma.patient.findUnique({ where: { rmNumber: p.rmNumber } });
    if (!patient) {
      patient = await prisma.patient.create({
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
          registeredBy: p.registeredBy ?? 'Dev Seed',
        },
      });

      const createdEncounter = await prisma.encounter.create({
        data: {
          patientId: patient.id,
          doctorId: mainDoctorId,
          visitDate: p.registrationDate,
          queueNumber: p.queueNumber,
          statusKunjungan: p.statusKunjungan,
          subjective: p.lastSoap?.subjective ?? '',
          objective: p.lastSoap?.objective ?? '',
          diagnosisIcd10: p.lastSoap?.diagnosisIcd10 ?? 'K02.1',
          suggestedTreatmentsJson: JSON.stringify(p.lastSoap?.suggestedTreatments ?? ['TRT-001']),
          prescriptionNotes: p.lastSoap?.prescriptionNotes ?? '',
          registeredBy: p.registeredBy ?? 'Dev Seed',
        },
      });

      await prisma.odontogramRecord.create({
        data: {
          encounterId: createdEncounter.id,
          patientId: patient.id,
          dentitionType: p.age <= 12 ? 'mixed' : 'adult',
          teethJson: JSON.stringify(p.initialOdontogram ?? {}),
        },
      });
    }
    seededPatients.push({ id: patient.id, name: patient.name, rmNumber: patient.rmNumber });
  }

  // Seed Appointment & QueueCall secara idempoten jika belum ada data hari ini
  const today = new Date().toISOString().slice(0, 10);
  if (seededPatients.length > 0) {
    const existingAppointments = await prisma.appointment.count({
      where: { scheduledDate: today },
    });
    if (existingAppointments === 0) {
      await prisma.appointment.create({
        data: {
          patientId: seededPatients[0].id,
          doctorId: mainDoctorId,
          scheduledDate: today,
          scheduledTime: '09:30',
          durationMin: 30,
          chiefComplaint: 'Kontrol tambal gigi dan pembersihan karang gigi',
          status: 'CONFIRMED',
        },
      });
    }

    const existingQueueCalls = await prisma.queueCall.count();
    if (existingQueueCalls === 0) {
      await prisma.queueCall.create({
        data: {
          queueNumber: 'A-001',
          patientName: seededPatients[0].name,
          roomName: 'Ruang Tindakan 01',
          doctorName: 'drg. Yuli Kartilla Panjaitan',
        },
      });
    }
  }

  console.log('[DEV_SEED] Seeding development lokal selesai.');
}

main()
  .catch((err) => {
    console.error('[DEV_SEED] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
