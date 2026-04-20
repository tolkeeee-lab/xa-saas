/**
 * POST /api/employe/verify-pin
 *
 * Public endpoint — verifies an employee's PIN and sets a 30-day session cookie.
 *
 * Brute-force protection:
 *   - After 5 consecutive failures, locks account for 15 minutes (stored in DB).
 *   - On success, resets failed_pin_attempts, updates last_login_at / last_login_ip.
 *
 * Body: { employe_id: string, pin_hash: string (64-char hex SHA-256) }
 * Response 200: { success: true, employe: { id, nom, prenom, role, boutique_id } }
 * Response 401: { error: string }
 * Response 423: { error: string, locked_until: string } — account locked
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  setEmployeCookie,
  createEmployeSession,
} from '@/lib/employe-session-server';

const PIN_HASH_RE = /^[0-9a-f]{64}$/i;
const PIN_MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'anonymous'
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { employe_id, pin_hash } = body as Record<string, unknown>;

  if (typeof employe_id !== 'string' || !employe_id) {
    return NextResponse.json({ error: 'employe_id requis' }, { status: 400 });
  }
  if (typeof pin_hash !== 'string' || !PIN_HASH_RE.test(pin_hash)) {
    return NextResponse.json(
      { error: 'Format pin_hash invalide (SHA-256 hex attendu)' },
      { status: 400 },
    );
  }

  const ip = getIp(request);
  const admin = createAdminClient();

  // Fetch the employee
  const { data: employe, error: fetchError } = await admin
    .from('employes')
    .select('id, nom, prenom, role, pin, actif, boutique_id, failed_pin_attempts, locked_until')
    .eq('id', employe_id)
    .single();

  if (fetchError || !employe) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
  }

  if (!employe.actif) {
    return NextResponse.json({ error: 'Compte désactivé' }, { status: 403 });
  }

  // Check if account is locked
  if (employe.locked_until && new Date(employe.locked_until) > new Date()) {
    const retryAfterSec = Math.ceil(
      (new Date(employe.locked_until).getTime() - Date.now()) / 1000,
    );
    return NextResponse.json(
      {
        error: 'Trop de tentatives incorrectes. Réessayez plus tard.',
        locked_until: employe.locked_until,
      },
      {
        status: 423,
        headers: { 'Retry-After': String(retryAfterSec) },
      },
    );
  }

  // Constant-time PIN comparison
  const storedBuf = Buffer.from(employe.pin, 'hex');
  const receivedBuf = Buffer.from(pin_hash.toLowerCase(), 'hex');

  const match =
    storedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(storedBuf, receivedBuf);

  if (!match) {
    const newAttempts = (employe.failed_pin_attempts ?? 0) + 1;
    const shouldLock = newAttempts >= PIN_MAX_ATTEMPTS;

    await admin
      .from('employes')
      .update({
        failed_pin_attempts: newAttempts,
        locked_until: shouldLock
          ? new Date(Date.now() + LOCK_DURATION_MS).toISOString()
          : null,
      })
      .eq('id', employe_id);

    if (shouldLock) {
      console.warn('[employe/verify-pin] compte_verrouille', {
        employe_id,
        ip,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          error: 'Trop de tentatives incorrectes. Compte verrouillé 15 minutes.',
          locked_until: new Date(Date.now() + LOCK_DURATION_MS).toISOString(),
        },
        {
          status: 423,
          headers: { 'Retry-After': String(LOCK_DURATION_MS / 1000) },
        },
      );
    }

    return NextResponse.json({ error: 'PIN incorrect' }, { status: 401 });
  }

  // Success — reset attempts, update audit fields
  await admin
    .from('employes')
    .update({
      failed_pin_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
      last_login_ip: ip,
    })
    .eq('id', employe_id);

  // Set the 30-day session cookie
  const session = createEmployeSession(employe.id, employe.boutique_id, employe.role);
  await setEmployeCookie(session);

  console.info('[employe/verify-pin] connexion_reussie', {
    employe_id,
    boutique_id: employe.boutique_id,
    ip,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    employe: {
      id: employe.id,
      nom: employe.nom,
      prenom: employe.prenom,
      role: employe.role,
      boutique_id: employe.boutique_id,
    },
  });
}
