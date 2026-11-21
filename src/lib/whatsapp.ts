import { prisma } from './prisma';

export interface WhatsAppConfig {
  enabled: boolean;
  provider: 'FONNTE' | 'WABLAS';
  apiToken: string;
  endpointUrl: string;
  adminPhone: string;
}

const DEFAULT_WA_CONFIG: WhatsAppConfig = {
  enabled: false,
  provider: 'FONNTE',
  apiToken: '',
  endpointUrl: 'https://api.fonnte.com/send',
  adminPhone: '',
};

export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const rows = await prisma.clinicSetting.findMany({
    where: {
      key: { in: ['wa_enabled', 'wa_provider', 'wa_api_token', 'wa_endpoint_url', 'wa_admin_phone'] },
    },
  });

  const map = new Map(rows.map((r) => [r.key, r.value]));
  const provider = map.get('wa_provider') === 'WABLAS' ? 'WABLAS' : 'FONNTE';
  const defaultUrl =
    provider === 'WABLAS' ? 'https://pati.wablas.com/api/send-message' : 'https://api.fonnte.com/send';

  return {
    enabled: map.get('wa_enabled') === 'true',
    provider,
    apiToken: map.get('wa_api_token') || '',
    endpointUrl: map.get('wa_endpoint_url') || defaultUrl,
    adminPhone: map.get('wa_admin_phone') || '',
  };
}

export async function saveWhatsAppConfig(cfg: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
  const current = await getWhatsAppConfig();
  const next: WhatsAppConfig = {
    ...DEFAULT_WA_CONFIG,
    ...current,
    ...cfg,
  };

  const pairs: [string, string][] = [
    ['wa_enabled', String(Boolean(next.enabled))],
    ['wa_provider', next.provider],
    ['wa_api_token', next.apiToken.trim()],
    ['wa_endpoint_url', next.endpointUrl.trim()],
    ['wa_admin_phone', next.adminPhone.trim()],
  ];

  await Promise.all(
    pairs.map(([key, value]) =>
      prisma.clinicSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );

  return next;
}

export function normalizeIndoPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return `62${digits}`;
}

export async function sendWhatsAppMessage(
  targetPhone: string,
  message: string,
  overrideConfig?: WhatsAppConfig
): Promise<{ sent: boolean; mode: 'LIVE' | 'DRY_RUN' | 'DISABLED'; detail: string }> {
  const cfg = overrideConfig || (await getWhatsAppConfig());
  const normalizedTarget = normalizeIndoPhone(targetPhone);

  if (!normalizedTarget) {
    return { sent: false, mode: 'DISABLED', detail: 'Nomor tujuan WhatsApp tidak valid.' };
  }

  if (!cfg.enabled) {
    return { sent: false, mode: 'DISABLED', detail: 'Webhook WhatsApp belum diaktifkan di Pengaturan.' };
  }

  if (!cfg.apiToken) {
    return {
      sent: false,
      mode: 'DRY_RUN',
      detail: 'API Token belum diisi; pesan hanya dicatat sebagai simulasi (Dry-Run).',
    };
  }

  try {
    if (cfg.provider === 'WABLAS') {
      const res = await fetch(cfg.endpointUrl || 'https://pati.wablas.com/api/send-message', {
        method: 'POST',
        headers: {
          Authorization: cfg.apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: normalizedTarget,
          message,
        }),
      });
      const text = await res.text();
      return {
        sent: res.ok,
        mode: 'LIVE',
        detail: res.ok ? 'Terkirim via Wablas.' : `Wablas HTTP ${res.status}: ${text.slice(0, 120)}`,
      };
    }

    // Default: Fonnte
    const form = new URLSearchParams();
    form.set('target', normalizedTarget);
    form.set('message', message);

    const res = await fetch(cfg.endpointUrl || 'https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: cfg.apiToken,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    const text = await res.text();
    return {
      sent: res.ok,
      mode: 'LIVE',
      detail: res.ok ? 'Terkirim via Fonnte.' : `Fonnte HTTP ${res.status}: ${text.slice(0, 120)}`,
    };
  } catch (err) {
    return {
      sent: false,
      mode: 'LIVE',
      detail: err instanceof Error ? err.message : 'Gagal menghubungi gateway WhatsApp.',
    };
  }
}

export async function sendBookingWhatsAppNotification(params: {
  patientName: string;
  patientPhone: string;
  rmNumber: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceName: string;
  doctorName: string;
}) {
  const cfg = await getWhatsAppConfig();
  if (!cfg.enabled) {
    return { patient: null, admin: null, status: 'DISABLED' as const };
  }

  const patientMsg =
    `Halo *${params.patientName}*,\n\n` +
    `Terima kasih telah melakukan booking online di *Yovela Dental Clinic*.\n` +
    `• No. RM: ${params.rmNumber}\n` +
    `• Jadwal: ${params.scheduledDate} pukul ${params.scheduledTime} WIB\n` +
    `• Layanan: ${params.serviceName}\n` +
    `• Dokter: ${params.doctorName}\n\n` +
    `Mohon hadir 10 menit sebelum jadwal. Jika ingin menjadwalkan ulang, silakan balas pesan ini.`;

  const adminMsg =
    `*[BOOKING BARU — YOVELA DENTAL]*\n` +
    `Pasien: ${params.patientName} (${params.rmNumber})\n` +
    `WA: ${params.patientPhone}\n` +
    `Jadwal: ${params.scheduledDate} ${params.scheduledTime} WIB\n` +
    `Layanan: ${params.serviceName}`;

  const [patientRes, adminRes] = await Promise.all([
    sendWhatsAppMessage(params.patientPhone, patientMsg, cfg),
    cfg.adminPhone ? sendWhatsAppMessage(cfg.adminPhone, adminMsg, cfg) : Promise.resolve(null),
  ]);

  return { patient: patientRes, admin: adminRes, status: 'PROCESSED' as const };
}
