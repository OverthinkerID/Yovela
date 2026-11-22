import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppDataMode, getAppRuntimeEnv, isVercelDeployment } from '@/lib/environment';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const runtimeEnv = getAppRuntimeEnv();
    const dataMode = getAppDataMode();
    const isVercel = isVercelDeployment();

    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      runtimeEnv,
      dataMode,
      isVercel,
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HEALTH_CHECK_ERROR]', error);
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: 'Koneksi database atau konfigurasi environment bermasalah.',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
