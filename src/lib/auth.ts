import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from './prisma';

export type UserRole = 'DOKTER' | 'DOKTER_LAIN' | 'PENDAFTARAN' | 'KASIR';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  sipNumber?: string | null;
  ihsPractitionerId?: string | null;
}

const COOKIE_NAME = 'yovela_session';
const SESSION_MAX_AGE = 60 * 60 * 12; // 12 jam

function getSecret(): string {
  return process.env.SESSION_SECRET || 'yovela-dental-clinic-fallback-dev-secret-2026';
}

function signPayload(payloadB64: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

export function createSessionToken(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = signPayload(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token: string): { userId: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expectedSig = signPayload(payloadB64);

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!decoded.userId || typeof decoded.exp !== 'number' || decoded.exp < Date.now()) {
      return null;
    }
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const token = createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const verified = verifySessionToken(token);
  if (!verified) return null;

  const user = await prisma.user.findUnique({
    where: { id: verified.userId },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      roleLabel: true,
      sipNumber: true,
      ihsPractitionerId: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role as UserRole,
    roleLabel: user.roleLabel,
    sipNumber: user.sipNumber,
    ihsPractitionerId: user.ihsPractitionerId,
  };
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<
  | { user: SessionUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Sesi tidak valid. Silakan login terlebih dahulu.' }, { status: 401 }),
    };
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Akses ditolak untuk peran Anda.' }, { status: 403 }),
    };
  }
  return { user, errorResponse: null };
}
