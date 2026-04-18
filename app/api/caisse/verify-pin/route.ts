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
 * Body: { boutique_id: UUID, pin_hash: string (64-char hex SHA-256) }
 *
 * Response 200: { success: true, boutique: { id, nom, couleur_theme } }
 * Response 401: { error: string }
 * Response 429: { error: string } + Retry-After header
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase-admin';
import { isPinLocked, recordPinFailure, clearPinFailures, PIN_WINDOW_MS } from '@/lib/rateLimit';

const PIN_HASH_RE = /^[0-9a-f]{64}$/i;

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

  const { boutique_id, pin_hash } = rawBody as {
    boutique_id: string;
    pin_hash: string;
  };

  // Basic format validation
  if (!PIN_HASH_RE.test(pin_hash)) {
    return NextResponse.json(
      { error: 'Format pin_hash invalide (SHA-256 hex attendu)' },
      { status: 400 },
    );
  }

  const ip = getIp(request);
  const bruteKey = `pin:${ip}:${boutique_id}`;

  // Check if already locked out
  const lockStatus = isPinLocked(bruteKey);
  if (lockStatus.locked) {
    return NextResponse.json(
      { error: 'Trop de tentatives incorrectes. Réessayez plus tard.' },
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
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });
  }

  // Constant-time comparison to prevent timing attacks
  const storedBuf = Buffer.from(boutique.pin_caisse, 'hex');
  const receivedBuf = Buffer.from(pin_hash.toLowerCase(), 'hex');

  const match =
    storedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(storedBuf, receivedBuf);

  if (!match) {
    const blocked = recordPinFailure(bruteKey);

    if (blocked) {
      return NextResponse.json(
        { error: 'Trop de tentatives incorrectes. Réessayez plus tard.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.round(PIN_WINDOW_MS / 1_000)) },
        },
      );
    }

    return NextResponse.json(
      { error: 'PIN incorrect' },
      { status: 401 },
    );
  }

  // Success — clear brute-force counter and return boutique info (no PIN)
  clearPinFailures(bruteKey);

  return NextResponse.json({
    success: true,
    boutique: {
      id: boutique.id,
      nom: boutique.nom,
      couleur_theme: boutique.couleur_theme,
    },
  });
}
