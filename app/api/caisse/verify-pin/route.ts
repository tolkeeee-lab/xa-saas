/**
 * POST /api/caisse/verify-pin
 *
 * Public endpoint (no session required) — used by physical POS terminals.
 *
 * Verifies the SHA-256 PIN hash for a boutique's `pin_caisse`.
 * Applies a strict per-IP × per-boutique brute-force counter: after 5
 * consecutive failures within 15 minutes the endpoint returns 429 with a
 * `Retry-After` header and the number of seconds until the lockout expires.
 *
 * On success a short-lived caisse session token is created (8 h TTL) and
 * returned alongside the boutique info. POS clients should store this token
 * and send it as the `x-caisse-token` header on subsequent caisse requests
 * instead of re-sending the PIN hash.
 *
 * Security notes:
 *  - Error responses are intentionally generic to prevent boutique enumeration.
 *  - All security events are logged server-side for monitoring/audit.
 *  - PIN lock can be backed by Upstash Redis (set USE_DISTRIBUTED_RATE_LIMIT=true).
 *
 * Body: { boutique_id: UUID, pin_hash: string (64-char hex SHA-256), terminal_id?: string (UUID) }
 *
 * Response 200: { success: true, boutique: { id, nom, couleur_theme }, session: { token, expires_at }, terminal_id?: string }
 * Response 401: { error: string }
 * Response 429: { error: string } + Retry-After header
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase-admin';
import { isPinLocked, recordPinFailure, clearPinFailures } from '@/lib/rateLimit';
import { createCaisseSession } from '@/lib/caisseSession';

const PIN_HASH_RE = /^[0-9a-f]{64}$/i;
/** Validates that a terminal_id is a well-formed UUID v4. */
const TERMINAL_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Generic public error for any invalid credentials — avoids boutique enumeration. */
const ERR_INVALID_CREDENTIALS = 'Identifiants caisse invalides';
const ERR_TOO_MANY_ATTEMPTS = 'Trop de tentatives incorrectes. Réessayez plus tard.';

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'anonymous'
  );
}

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (
    !rawBody ||
    typeof rawBody !== 'object' ||
    typeof (rawBody as Record<string, unknown>).boutique_id !== 'string' ||
    typeof (rawBody as Record<string, unknown>).pin_hash !== 'string'
  ) {
    return NextResponse.json(
      { error: 'boutique_id et pin_hash requis' },
      { status: 400 },
    );
  }

  const { boutique_id, pin_hash, terminal_id } = rawBody as {
    boutique_id: string;
    pin_hash: string;
    terminal_id?: string;
  };

  // Basic format validation
  if (!PIN_HASH_RE.test(pin_hash)) {
    return NextResponse.json(
      { error: 'Format pin_hash invalide (SHA-256 hex attendu)' },
      { status: 400 },
    );
  }

  // Validate terminal_id format if provided; silently ignore if malformed so
  // we don't break existing clients that don't send it.
  const validatedTerminalId =
    terminal_id && TERMINAL_ID_RE.test(terminal_id) ? terminal_id : undefined;

  const ip = getIp(request);
  const bruteKey = `pin:${ip}:${boutique_id}`;

  // Check if already locked out
  const lockStatus = await isPinLocked(bruteKey);
  if (lockStatus.locked) {
    console.warn('[verify-pin] verrou_actif', {
      ip,
      boutique_id,
      retry_after: lockStatus.retryAfterSec,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: ERR_TOO_MANY_ATTEMPTS },
      {
        status: 429,
        headers: { 'Retry-After': String(lockStatus.retryAfterSec) },
      },
    );
  }

  const admin = createAdminClient();

  const { data: boutique, error } = await admin
    .from('boutiques')
    .select('id, nom, couleur_theme, pin_caisse')
    .eq('id', boutique_id)
    .eq('actif', true)
    .single();

  if (error || !boutique) {
    // Record failure to maintain consistent lock behavior regardless of boutique existence.
    const failResult = await recordPinFailure(bruteKey);
    console.warn('[verify-pin] tentative_echouee', {
      ip,
      boutique_id,
      raison: 'boutique_inconnue',
      timestamp: new Date().toISOString(),
    });
    if (failResult.blocked) {
      console.warn('[verify-pin] verrou_declenche', {
        ip,
        boutique_id,
        retry_after: failResult.retryAfterSec,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: ERR_TOO_MANY_ATTEMPTS },
        {
          status: 429,
          headers: { 'Retry-After': String(failResult.retryAfterSec) },
        },
      );
    }
    // Generic 401 — do not reveal whether the boutique_id exists.
    return NextResponse.json({ error: ERR_INVALID_CREDENTIALS }, { status: 401 });
  }

  // Constant-time comparison to prevent timing attacks
  const storedBuf = Buffer.from(boutique.pin_caisse, 'hex');
  const receivedBuf = Buffer.from(pin_hash.toLowerCase(), 'hex');

  const match =
    storedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(storedBuf, receivedBuf);

  if (!match) {
    const failResult = await recordPinFailure(bruteKey);
    console.warn('[verify-pin] tentative_echouee', {
      ip,
      boutique_id,
      raison: 'pin_invalide',
      timestamp: new Date().toISOString(),
    });
    if (failResult.blocked) {
      console.warn('[verify-pin] verrou_declenche', {
        ip,
        boutique_id,
        retry_after: failResult.retryAfterSec,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: ERR_TOO_MANY_ATTEMPTS },
        {
          status: 429,
          headers: { 'Retry-After': String(failResult.retryAfterSec) },
        },
      );
    }

    return NextResponse.json({ error: ERR_INVALID_CREDENTIALS }, { status: 401 });
  }

  // Success — clear brute-force counter, create a short-lived caisse session,
  // and return boutique info (no PIN) alongside the session token.
  await clearPinFailures(bruteKey);
  const { token, expires_at } = createCaisseSession(boutique_id, validatedTerminalId);

  // Register / refresh the terminal record asynchronously.
  // This is fire-and-forget: a failure here must never block a successful login.
  if (validatedTerminalId) {
    const now = new Date().toISOString();
    admin
      .from('caisse_terminals')
      .upsert(
        {
          boutique_id,
          terminal_id: validatedTerminalId,
          last_seen_at: now,
          last_ip: ip !== 'anonymous' ? ip : null,
          statut: 'actif',
        },
        {
          onConflict: 'boutique_id,terminal_id',
          ignoreDuplicates: false,
        },
      )
      .then(({ error: upsertErr }) => {
        if (upsertErr) {
          console.warn('[verify-pin] terminal_upsert_failed', {
            boutique_id,
            terminal_id: validatedTerminalId,
            error: upsertErr.message,
          });
        }
      })
      .catch(() => {
        // Swallow — terminal tracking must not impact the auth flow.
      });
  }

  console.info('[verify-pin] connexion_reussie', {
    ip,
    boutique_id,
    terminal_id: validatedTerminalId ?? null,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    boutique: {
      id: boutique.id,
      nom: boutique.nom,
      couleur_theme: boutique.couleur_theme,
    },
    session: {
      token,
      expires_at,
    },
    ...(validatedTerminalId ? { terminal_id: validatedTerminalId } : {}),
  });
}
