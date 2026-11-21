import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  sendWhatsAppMessage,
} from '../../../../lib/whatsapp';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const { errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  const config = await getWhatsAppConfig();
  return NextResponse.json({
    config: {
      ...config,
      hasToken: Boolean(config.apiToken),
      apiToken: config.apiToken ? `${config.apiToken.slice(0, 4)}••••${config.apiToken.slice(-3)}` : '',
    },
  });
}

export async function PATCH(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const current = await getWhatsAppConfig();
    const rawToken = typeof body.apiToken === 'string' ? body.apiToken.trim() : '';
    const keepExistingToken = rawToken.includes('••••');

    const updated = await saveWhatsAppConfig({
      enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
      provider: body.provider === 'WABLAS' ? 'WABLAS' : 'FONNTE',
      apiToken: keepExistingToken ? current.apiToken : rawToken,
      endpointUrl: typeof body.endpointUrl === 'string' ? body.endpointUrl : current.endpointUrl,
      adminPhone: typeof body.adminPhone === 'string' ? body.adminPhone : current.adminPhone,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_WHATSAPP_WEBHOOK',
        entityType: 'ClinicSetting',
        entityId: 'whatsapp',
        metadataJson: JSON.stringify({ provider: updated.provider, enabled: updated.enabled }),
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        ...updated,
        hasToken: Boolean(updated.apiToken),
        apiToken: updated.apiToken ? `${updated.apiToken.slice(0, 4)}••••${updated.apiToken.slice(-3)}` : '',
      },
    });
  } catch (err) {
    console.error('PATCH /api/settings/whatsapp error:', err);
    return NextResponse.json({ error: 'Gagal menyimpan konfigurasi WhatsApp Webhook.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const cfg = await getWhatsAppConfig();
    const target = String(body.testPhone || cfg.adminPhone || '').trim();
    if (!target) {
      return NextResponse.json({ error: 'Masukkan nomor WhatsApp tujuan pengujian terlebih dahulu.' }, { status: 400 });
    }

    const result = await sendWhatsAppMessage(
      target,
      'Halo! Ini pesan uji coba dari *Yovela Dental Clinic — SIM-RME* (Overthinker Studio). Koneksi WhatsApp Webhook aktif.',
      { ...cfg, enabled: true }
    );

    return NextResponse.json({ result });
  } catch (err) {
    console.error('POST /api/settings/whatsapp error:', err);
    return NextResponse.json({ error: 'Gagal menjalankan uji kirim WhatsApp.' }, { status: 500 });
  }
}
