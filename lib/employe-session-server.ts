/**
 * Employee session management — SERVER ONLY.
 *
 * Each employee authenticates via their personal invite link + PIN.
 * A 30-day rolling HttpOnly cookie (`xa_employe_session`) is issued on success.
 *
 * Token format (opaque string):
 *   base64url(JSON.stringify(payload)) + "." + HMAC-SHA256(secret, encoded_payload)
 *
 * Payload: { employe_id, boutique_id, role, expires_at (Unix ms) }
 *
 * Environment variable:
 *   EMPLOYE_SESSION_SECRET — required in production; random 32+ byte string.
 */

import crypto from 'crypto';
import { cookies } from 'next/headers';

export const EMPLOYE_COOKIE_NAME = 'xa_employe_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds
const COOKIE_MAX_AGE_MS = COOKIE_MAX_AGE * 1000;

export type EmployeSessionPayload = {
  employe_id: string;
  boutique_id: string;
  role: 'caissier' | 'gerant';
  /** Unix timestamp (ms) — token expiry. */
  expires_at: number;
};

export type EmployeSession = EmployeSessionPayload;

function getSecret(): Buffer {
  const secret = process.env.EMPLOYE_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('EMPLOYE_SESSION_SECRET env var is required in production');
    }
    console.warn('[employe-session] EMPLOYE_SESSION_SECRET not set — using dev fallback');
    return Buffer.from('xa-employe-session-dev-secret-not-for-production', 'utf8');
  }
  return Buffer.from(secret, 'utf8');
}

function base64urlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(input: string): string | null {
  try {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (padded.length % 4)) % 4;
    return Buffer.from(padded + '='.repeat(padding), 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function computeHmac(encodedPayload: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(encodedPayload)
    .digest('hex');
}

/** Creates a signed employee session token. */
export function signEmployeSessionToken(payload: EmployeSessionPayload): string {
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = computeHmac(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

/** Validates a token string. Returns the payload or null if invalid/expired. */
export function validateEmployeSessionToken(token: string): EmployeSessionPayload | null {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;

  const encodedPayload = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = computeHmac(encodedPayload);

  // Constant-time comparison
  if (
    providedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(providedSig, 'hex'), Buffer.from(expectedSig, 'hex'))
  ) {
    return null;
  }

  const raw = base64urlDecode(encodedPayload);
  if (!raw) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof (payload as Record<string, unknown>).employe_id !== 'string' ||
    typeof (payload as Record<string, unknown>).boutique_id !== 'string' ||
    typeof (payload as Record<string, unknown>).expires_at !== 'number'
  ) {
    return null;
  }

  const p = payload as EmployeSessionPayload;
  if (p.expires_at < Date.now()) return null;

  return p;
}

/** Sets the employee session cookie (30-day rolling TTL). */
export async function setEmployeCookie(session: EmployeSession): Promise<void> {
  const token = signEmployeSessionToken(session);
  const cookieStore = await cookies();
  cookieStore.set({
    name: EMPLOYE_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/** Reads and validates the employee session cookie. Returns null if missing or invalid. */
export async function getEmployeSession(): Promise<EmployeSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EMPLOYE_COOKIE_NAME)?.value;
  if (!token) return null;
  return validateEmployeSessionToken(token);
}

/** Clears the employee session cookie (logout). */
export async function clearEmployeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(EMPLOYE_COOKIE_NAME);
}

/**
 * Returns true if the session should be refreshed because fewer than 7 days remain.
 * Call in middleware to implement rolling 30-day sessions.
 */
export function shouldRefreshCookie(expiresAt: number): boolean {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  return expiresAt - Date.now() < SEVEN_DAYS_MS;
}

/** Creates a fresh session payload expiring 30 days from now. */
export function createEmployeSession(
  employe_id: string,
  boutique_id: string,
  role: 'caissier' | 'gerant',
): EmployeSession {
  return {
    employe_id,
    boutique_id,
    role,
    expires_at: Date.now() + COOKIE_MAX_AGE_MS,
  };
}
