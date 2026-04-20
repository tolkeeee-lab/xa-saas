/**
 * Employee session management — distinct from the caisse boutique session.
 *
 * After a successful PIN verification at `/caisse/lock`, a short-lived
 * employee session token is issued.  It is stored:
 *   • As an HttpOnly cookie  `xa_employe_session`  (for server components / middleware)
 *   • In localStorage         `xa-employe-session`  (for client-side reads, best-effort)
 *
 * Token format (opaque string):
 *   base64url(JSON.stringify(payload)) + "." + HMAC-SHA256(secret, encodedPayload)
 *
 * Payload: EmployeSessionPayload
 *
 * Session TTL: 8 hours (one cashier shift) — same as the caisse session.
 *
 * Environment variable:
 *   EMPLOYE_SESSION_SECRET — required in production.  Falls back to a
 *   dev-only weak secret if absent (warning is logged).
 */

import crypto from 'crypto';
import { base64urlDecode, base64urlEncode } from './base64url';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default session TTL in hours (one cashier shift). */
const SESSION_TTL_HOURS = 8;
const SESSION_TTL_MS = SESSION_TTL_HOURS * 60 * 60 * 1_000;

export const EMPLOYE_COOKIE_NAME = 'xa_employe_session';
export const EMPLOYE_STORAGE_KEY = 'xa-employe-session';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmployeRole = 'caissier' | 'gerant' | 'vendeur';

export type EmployeSession = {
  employe_id: string;
  /** Display name: "Prénom N." */
  employe_nom: string;
  boutique_id: string;
  boutique_nom: string;
  role: EmployeRole;
  /** Unix timestamp (seconds) — token expiry. */
  exp: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSecret(): Buffer {
  const secret = process.env.EMPLOYE_SESSION_SECRET;
  if (!secret) {
    console.warn(
      '[employe-session] EMPLOYE_SESSION_SECRET is not set – employee sessions are NOT secure. ' +
        'Set this env var to a random 32+ byte string in production.',
    );
    return Buffer.from('dev-insecure-employe-secret-change-me', 'utf8');
  }
  return Buffer.from(secret, 'utf8');
}

function computeHmac(encodedPayload: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(encodedPayload)
    .digest('hex');
}

// ─── Token creation ───────────────────────────────────────────────────────────

/**
 * Creates a signed employee session token.
 * Returns the token string and its ISO-8601 expiry.
 */
export function createEmployeSessionToken(
  data: Omit<EmployeSession, 'exp'>,
): { token: string; expires_at: string } {
  const expSec = Math.floor((Date.now() + SESSION_TTL_MS) / 1_000);
  const payload: EmployeSession = { ...data, exp: expSec };
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = computeHmac(encodedPayload);
  const token = `${encodedPayload}.${signature}`;
  return { token, expires_at: new Date(expSec * 1_000).toISOString() };
}

// ─── Token validation ─────────────────────────────────────────────────────────

/**
 * Validates an employee session token.
 * Returns the parsed session or null if invalid/expired.
 */
export function validateEmployeSessionToken(
  token: string | null | undefined,
): EmployeSession | null {
  if (!token) return null;

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const encodedPayload = token.slice(0, dotIdx);
  const signature = token.slice(dotIdx + 1);

  const expectedSig = computeHmac(encodedPayload);
  let signatureValid = false;
  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length === 32 && expectedBuf.length === 32) {
      signatureValid = crypto.timingSafeEqual(sigBuf, expectedBuf);
    }
  } catch {
    // ignore
  }
  if (!signatureValid) return null;

  const rawPayload = base64urlDecode(encodedPayload);
  if (rawPayload === null) return null;

  let payload: EmployeSession;
  try {
    payload = JSON.parse(rawPayload) as EmployeSession;
  } catch {
    return null;
  }

  if (!payload.employe_id || !payload.boutique_id || typeof payload.exp !== 'number') {
    return null;
  }

  if (Math.floor(Date.now() / 1_000) > payload.exp) return null;

  return payload;
}
