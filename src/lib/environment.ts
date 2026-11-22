export type AppDataMode = 'real' | 'mock';
export type AppRuntimeEnv = 'development' | 'preview' | 'production' | 'test';

const PLACEHOLDER_SECRETS = new Set([
  'ganti-dengan-string-acak-minimal-32-karakter',
  'replace-with-32-char-random-secret',
  'changeme',
]);

export function getAppRuntimeEnv(): AppRuntimeEnv {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'preview';
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  return 'development';
}

export function isVercelDeployment(): boolean {
  return process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
}

export function isProductionLikeEnv(): boolean {
  const env = getAppRuntimeEnv();
  return env === 'production' || env === 'preview';
}

export function getAppDataMode(): AppDataMode {
  const raw = (process.env.APP_DATA_MODE || 'real').trim().toLowerCase();

  if (raw === 'mock') {
    if (isProductionLikeEnv() || isVercelDeployment()) {
      throw new Error(
        '[SECURITY_CONFIG_ERROR] APP_DATA_MODE=mock tidak diizinkan pada lingkungan production, preview, atau Vercel.'
      );
    }
    return 'mock';
  }

  if (raw === 'real' || raw === 'database' || raw === '') {
    return 'real';
  }

  throw new Error(
    `[CONFIG_ERROR] APP_DATA_MODE="${raw}" tidak valid. Gunakan "real" (atau "mock" khusus development lokal).`
  );
}

export function isMockDataMode(): boolean {
  return getAppDataMode() === 'mock';
}

export function getAuthSecret(): string {
  const secret = (process.env.AUTH_SECRET || process.env.SESSION_SECRET || '').trim();
  const isStrong = secret.length >= 32 && !PLACEHOLDER_SECRETS.has(secret);

  if (isStrong) {
    return secret;
  }

  if (isVercelDeployment() || process.env.NODE_ENV === 'production') {
    if (secret && !PLACEHOLDER_SECRETS.has(secret) && !isVercelDeployment()) {
      return secret;
    }
    if (isVercelDeployment()) {
      throw new Error(
        '[SECURITY_CONFIG_ERROR] AUTH_SECRET (atau SESSION_SECRET) wajib diisi minimal 32 karakter acak pada Vercel/Production.'
      );
    }
  }

  if (!secret) {
    return 'yovela-local-dev-only-secret-do-not-use-in-prod-2026';
  }

  return secret;
}

export function validateEnvironment(): {
  runtimeEnv: AppRuntimeEnv;
  dataMode: AppDataMode;
  isVercel: boolean;
} {
  const runtimeEnv = getAppRuntimeEnv();
  const dataMode = getAppDataMode();
  const isVercel = isVercelDeployment();
  const dbUrl = (process.env.DATABASE_URL || '').trim();

  if (!dbUrl && dataMode === 'real') {
    throw new Error('[CONFIG_ERROR] DATABASE_URL wajib diisi saat APP_DATA_MODE=real.');
  }

  if (isVercel) {
    if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
      throw new Error(
        '[CONFIG_ERROR] Deployment Vercel/Production wajib menggunakan PostgreSQL (Neon/Supabase), bukan SQLite.'
      );
    }
    getAuthSecret();
  }

  return { runtimeEnv, dataMode, isVercel };
}

