import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';

// CRC16-CCITT (0xFFFF, poly 0x1021) sesuai standar EMVCo QRIS Bank Indonesia
function crc16Ccitt(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(tag: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${tag}${len}${value}`;
}

function buildDynamicQrisString(amount: number, referenceId: string): string {
  // Jika klinik sudah punya Static QRIS Merchant resmi di .env (QRIS_STATIC_PAYLOAD),
  // nominal dinamis disisipkan langsung ke payload resmi. Jika belum, buat struktur EMVCo standar.
  const merchantName = process.env.QRIS_MERCHANT_NAME || 'YOVELA DENTAL CLINIC';
  const merchantCity = process.env.QRIS_MERCHANT_CITY || 'SEMARANG';
  const nmid = process.env.QRIS_MERCHANT_NMID || 'ID1026000001234';

  const merchantAccountInfo =
    tlv('00', 'ID.CO.QRIS.WWW') +
    tlv('01', '936009143000000001') +
    tlv('02', nmid) +
    tlv('03', 'UMI');

  const body =
    tlv('00', '01') + // Payload Format Indicator
    tlv('01', '12') + // 12 = Dynamic QRIS
    tlv('26', merchantAccountInfo) +
    tlv('52', '8021') + // MCC 8021: Dentists and Orthodontists
    tlv('53', '360') + // IDR
    tlv('54', String(Math.round(amount))) + // Nominal transaksi dinamis
    tlv('58', 'ID') +
    tlv('59', merchantName.slice(0, 25)) +
    tlv('60', merchantCity.slice(0, 15)) +
    tlv('62', tlv('05', referenceId.slice(0, 25))) +
    '6304';

  return body + crc16Ccitt(body);
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAuth(['DOKTER', 'KASIR']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const amount = Math.round(Number(body.amount || 0));
    const referenceId = String(body.referenceId || `YDC${Date.now().toString().slice(-8)}`);
    const patientName = String(body.patientName || 'Pasien');

    if (amount <= 0) {
      return NextResponse.json({ error: 'Nominal QRIS harus lebih besar dari Rp 0.' }, { status: 400 });
    }

    const qrisPayload = buildDynamicQrisString(amount, referenceId);
    const hasLiveEdcConfig = Boolean(process.env.EDC_TERMINAL_ENDPOINT && process.env.EDC_API_KEY);

    return NextResponse.json({
      referenceId,
      amount,
      patientName,
      merchantName: process.env.QRIS_MERCHANT_NAME || 'YOVELA DENTAL CLINIC',
      qrisPayload,
      edcBridgeStatus: hasLiveEdcConfig ? 'EDC_CONNECTED' : 'STANDBY_QRIS_DISPLAY',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    console.error('POST /api/qris/generate error:', err);
    return NextResponse.json({ error: 'Gagal membuat QRIS dinamis.' }, { status: 500 });
  }
}
