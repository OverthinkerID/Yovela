import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

const dbUrl = (process.env.DATABASE_URL || '').trim();
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

// Single Source of Truth: selalu sinkronkan schema.postgresql.prisma dari schema.prisma
const sqliteSchemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
const pgSchemaPath = path.resolve(process.cwd(), 'prisma/schema.postgresql.prisma');
const sqliteSchema = fs.readFileSync(sqliteSchemaPath, 'utf8');
const pgSchema = sqliteSchema.replace(
  /provider\s*=\s*"sqlite"\s*\n\s*url\s*=\s*env\("DATABASE_URL"\)/,
  'provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")'
);
if (!fs.existsSync(pgSchemaPath) || fs.readFileSync(pgSchemaPath, 'utf8') !== pgSchema) {
  fs.writeFileSync(pgSchemaPath, pgSchema, 'utf8');
  console.log('🔄 schema.postgresql.prisma otomatis disinkronkan dari schema.prisma');
}

if (!process.argv.includes('--sync-only')) {
  const schemaFile = isPostgres ? 'prisma/schema.postgresql.prisma' : 'prisma/schema.prisma';
  console.log(`🔧 Prisma Generate menggunakan ${schemaFile} (${isPostgres ? 'PostgreSQL' : 'SQLite Lokal'})`);
  execSync(`npx prisma generate --schema=${schemaFile}`, { stdio: 'inherit' });
}

