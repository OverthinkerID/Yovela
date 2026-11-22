import fs from 'fs';
import path from 'path';
import { validateEnvironment } from '../src/lib/environment';

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

try {
  const result = validateEnvironment();
  console.log(
    `✅ Environment valid (${result.runtimeEnv} | dataMode=${result.dataMode} | vercel=${result.isVercel})`
  );
} catch (err) {
  console.error('❌ Validasi environment gagal:', err instanceof Error ? err.message : err);
  process.exit(1);
}

