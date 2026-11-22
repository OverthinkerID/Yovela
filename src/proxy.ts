import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'yovela_session';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/jadwal',
  '/pasien',
  '/antrean',
  '/poli',
  '/satusehat',
  '/stok',
  '/kasir',
  '/laporan',
];

function getEdgeAuthSecret(): string | null {
  const secret = (process.env.AUTH_SECRET || process.env.SESSION_SECRET || '').trim();
  if (secret) return secret;

  const isVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
  if (isVercel || process.env.NODE_ENV === 'production') {
    return null;
  }
  return 'yovela-local-dev-only-secret-do-not-use-in-prod-2026';
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function verifySessionCookieEdge(token: string): Promise<boolean> {
  const secret = getEdgeAuthSecret();
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
    const expectedSig = uint8ArrayToBase64Url(new Uint8Array(sigBuffer));

    if (sig.length !== expectedSig.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) {
      diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (diff !== 0) return false;

    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payloadB64));
    const decoded = JSON.parse(payloadJson) as { userId?: string; exp?: number };
    return Boolean(decoded.userId && typeof decoded.exp === 'number' && decoded.exp > Date.now());
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = token ? await verifySessionCookieEdge(token) : false;

  if (!valid) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete(COOKIE_NAME);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/jadwal/:path*',
    '/pasien/:path*',
    '/antrean/:path*',
    '/poli/:path*',
    '/satusehat/:path*',
    '/stok/:path*',
    '/kasir/:path*',
    '/laporan/:path*',
  ],
};
