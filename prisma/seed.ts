import { PrismaClient } from '@prisma/client';
import { DEFAULT_TREATMENTS } from '../src/lib/data/clinicalCatalog';

const prisma = new PrismaClient();

/**
 * Production-safe master catalog seed.
 * Hanya mengisi data master tindakan medis (Treatment) secara idempoten.
 * JANGAN PERNAH menaruh akun demo, password default, atau pasien dummy di sini.
 * Untuk data testing/development lokal, gunakan: npm run db:seed:dev
 */
async function main() {
  console.log('[MASTER_SEED] Menyinkronkan katalog master tindakan Yovela Dental Clinic...');

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

  console.log(`[MASTER_SEED] Selesai (${DEFAULT_TREATMENTS.length} master tindakan tersinkron).`);
}

main()
  .catch((e) => {
    console.error('[MASTER_SEED] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
