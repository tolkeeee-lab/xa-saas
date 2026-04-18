/**
 * Caisse session management.
 *
 * After a successful PIN verification (`POST /api/caisse/verify-pin`), a
 * short-lived caisse session token is issued and returned to the POS terminal.
 * Subsequent caisse requests supply this token so individual actions no longer
 * require re-sending the raw PIN hash.
 *
 * Token format (opaque string):
 *   base64url(JSON.stringify(payload)) + "." + HMAC-SHA256(secret, encoded_payload)
 *
 * Payload: { boutique_id: string, exp: number (Unix seconds) }
 *
 * Session TTL: SESSION_TTL_HOURS (default: 8 h – one cashier shift).
 *
 * Invalidation:
 *   Tokens can be actively revoked (e.g. on logout) by storing their signature
 *   in an in-memory denylist.  This is process-local only; for multi-instance
 *   deployments the short TTL provides the main expiry guarantee.
 *   If precise cross-instance revocation is required, a Redis-backed denylist
 *   can be added in a future iteration.
 *
 * Environment variable:
 *   CAISSE_SESSION_SECRET — required in production; a random 32+ byte string.
 *   If absent a warning is logged and a weak dev-only fallback is used.
 */

import crypto from 'crypto';

/** Session TTL in hours. One typical cashier shift. */
const SESSION_TTL_HOURS = 8;
const SESSION_TTL_MS = SESSION_TTL_HOURS * 60 * 60 * 1_000;

/** HTTP header name used by POS clients to carry the session token. */
export const CAISSE_SESSION_HEADER = 'x-caisse-token';

export type CaisseSessionPayload = {
  boutique_id: string;
  /** Unix timestamp (seconds) — token expiry. */
  exp: number;
  /** Optional stable terminal identifier (UUID from client localStorage). */
  terminal_id?: string;
};

export type CaisseSessionError =
  | 'MISSING'
  | 'MALFORMED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'INVALID_SIGNATURE'
  | 'WRONG_BOUTIQUE';

export type CaisseSessionValidation =
  | { valid: true; boutique_id: string; terminal_id?: string }
  | { valid: false; error: CaisseSessionError };

// ─── In-memory denylist ───────────────────────────────────────────────────────

/**
 * Maps a revoked token's HMAC signature (hex) to its expiry timestamp (ms).
 * Entries are pruned when the token's natural TTL has elapsed so the set
 * doesn't grow without bound.
 */
const denylist = new Map<string, number>();

function pruneDenylist(): void {
  const now = Date.now();
  for (const [sig, expMs] of denylist) {
    if (now > expMs) denylist.delete(sig);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSecret(): Buffer {
  const secret = process.env.CAISSE_SESSION_SECRET;
  if (!secret) {
    console.warn(
      '[caisseSession] CAISSE_SESSION_SECRET is not set – caisse sessions are NOT secure. ' +
        'Set this env var to a random 32+ byte string in production.',
    );
    return Buffer.from('dev-insecure-caisse-secret-change-me', 'utf8');
  }
  return Buffer.from(secret, 'utf8');
}

function base64urlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlDecode(input: string): string | null {
  try {
    const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
    return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
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

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates a signed caisse session token for the given boutique.
 *
 * Optionally embeds a `terminal_id` in the payload so the server can
 * correlate sessions to known POS devices.
 *
 * Returns the opaque token string and its ISO-8601 expiry date.
 */
export function createCaisseSession(
  boutique_id: string,
  terminal_id?: string,
): {
  token: string;
  /** ISO-8601 string — when the session expires. */
  expires_at: string;
} {
  const expSec = Math.floor((Date.now() + SESSION_TTL_MS) / 1_000);
  const payload: CaisseSessionPayload = {
    boutique_id,
    exp: expSec,
    ...(terminal_id ? { terminal_id } : {}),
  };
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = computeHmac(encodedPayload);
  const token = `${encodedPayload}.${signature}`;
  return { token, expires_at: new Date(expSec * 1_000).toISOString() };
}

/**
 * Validates a caisse session token.
 *
 * Pass `expectedBoutiqueId` to additionally verify that the token was issued
 * for a specific boutique.
 */
export function validateCaisseSession(
  token: string | null | undefined,
  expectedBoutiqueId?: string,
): CaisseSessionValidation {
  if (!token) return { valid: false, error: 'MISSING' };

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return { valid: false, error: 'MALFORMED' };

  const encodedPayload = token.slice(0, dotIdx);
  const signature = token.slice(dotIdx + 1);

  // Constant-time HMAC comparison to prevent timing-based attacks.
  // HMAC-SHA256 always produces 32 bytes → 64 hex chars.
  const expectedSig = computeHmac(encodedPayload);
  let signatureValid = false;
  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length === 32 && expectedBuf.length === 32) {
      signatureValid = crypto.timingSafeEqual(sigBuf, expectedBuf);
    }
  } catch {
    // Buffer.from(..., 'hex') can produce an empty buffer on invalid hex
  }

  if (!signatureValid) {
    return { valid: false, error: 'INVALID_SIGNATURE' };
  }

  const rawPayload = base64urlDecode(encodedPayload);
  if (rawPayload === null) return { valid: false, error: 'MALFORMED' };

  let payload: CaisseSessionPayload;
  try {
    payload = JSON.parse(rawPayload) as CaisseSessionPayload;
  } catch {
    return { valid: false, error: 'MALFORMED' };
  }

  if (!payload.boutique_id || typeof payload.exp !== 'number') {
    return { valid: false, error: 'MALFORMED' };
  }

  if (Math.floor(Date.now() / 1_000) > payload.exp) {
    return { valid: false, error: 'EXPIRED' };
  }

  if (denylist.has(signature)) {
    return { valid: false, error: 'REVOKED' };
  }

  if (expectedBoutiqueId && payload.boutique_id !== expectedBoutiqueId) {
    return { valid: false, error: 'WRONG_BOUTIQUE' };
  }

  return {
    valid: true,
    boutique_id: payload.boutique_id,
    ...(payload.terminal_id ? { terminal_id: payload.terminal_id } : {}),
  };
}

/**
 * Revokes a caisse session token by adding its signature to the in-memory
 * denylist.  The entry is kept until the token's natural TTL elapses, after
 * which it is pruned.
 *
 * Note: this denylist is process-local only.  In multi-instance deployments
 * the token will still be accepted by other instances until it expires on its
 * own.  For precise cross-instance revocation, a Redis-backed denylist should
 * be implemented.
 */
export function invalidateCaisseSession(token: string): void {
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return;

  const encodedPayload = token.slice(0, dotIdx);
  const signature = token.slice(dotIdx + 1);

  // Determine expiry so we can prune the denylist automatically.
  let expMs = Date.now() + SESSION_TTL_MS; // fallback
  const rawPayload = base64urlDecode(encodedPayload);
  if (rawPayload !== null) {
    try {
      const payload = JSON.parse(rawPayload) as Partial<CaisseSessionPayload>;
      if (typeof payload.exp === 'number') expMs = payload.exp * 1_000;
    } catch {
      // ignore parse errors; use fallback expiry
    }
  }

  denylist.set(signature, expMs);
  pruneDenylist();
}
