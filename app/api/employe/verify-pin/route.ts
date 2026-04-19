/**
 * POST /api/employe/verify-pin
 *
 * Public endpoint — used by the employee lock screen at /caisse/lock.
 *
 * Verifies a SHA-256 PIN hash against the `employes` table for a given boutique.
 * Applies the same per-IP × per-boutique brute-force counter as the caisse
 * verify-pin endpoint.
 *
 * On success:
 *  • Creates a signed employee session token (8 h TTL).
 *  • Returns the token alongside employee and boutique info.
 *  • The client stores the token in localStorage and POSTs it to
 *    /api/employe/session to set the HttpOnly cookie.
 *
 * Body: { boutique_id: UUID, pin_hash: string (64-char hex SHA-256) }
 *
 * Response 200: {
 *   success: true,
 *   employe: { id, nom, prenom, role },
 *   boutique: { id, nom },
 *   session: { token, expires_at }
 * }
 * Response 401: { error: string }
 * Response 429: { error: string } + Retry-After header
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase-admin';
import { isPinLocked, recordPinFailure, clearPinFailures } from '@/lib/rateLimit';
import { createEmployeSessionToken } from '@/lib/employe-session';
import type { EmployeRole } from '@/lib/employe-session';

const PIN_HASH_RE = /^[0-9a-f]{64}$/i;

const ERR_INVALID_CREDENTIALS = 'Identifiants employé invalides';
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

  const { boutique_id, pin_hash } = rawBody as {
    boutique_id: string;
    pin_hash: string;
  };

  if (!PIN_HASH_RE.test(pin_hash)) {
    return NextResponse.json(
      { error: 'Format pin_hash invalide (SHA-256 hex attendu)' },
      { status: 400 },
    );
  }

  const ip = getIp(request);
  const bruteKey = `employe-pin:${ip}:${boutique_id}`;

  const lockStatus = await isPinLocked(bruteKey);
  if (lockStatus.locked) {
    console.warn('[employe/verify-pin] verrou_actif', {
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

  // Verify boutique exists
  const { data: boutique, error: boutiqueError } = await admin
    .from('boutiques')
    .select('id, nom')
    .eq('id', boutique_id)
    .eq('actif', true)
    .single();

  if (boutiqueError || !boutique) {
    const failResult = await recordPinFailure(bruteKey);
    console.warn('[employe/verify-pin] boutique_inconnue', { ip, boutique_id });
    if (failResult.blocked) {
      return NextResponse.json(
        { error: ERR_TOO_MANY_ATTEMPTS },
        { status: 429, headers: { 'Retry-After': String(failResult.retryAfterSec) } },
      );
    }
    return NextResponse.json({ error: ERR_INVALID_CREDENTIALS }, { status: 401 });
  }

  // Fetch all active employees for the boutique (to find PIN match)
  const { data: employes, error: employeError } = await admin
    .from('employes')
    .select('id, nom, prenom, role, pin')
    .eq('boutique_id', boutique_id)
    .eq('actif', true);

  if (employeError || !employes?.length) {
    const failResult = await recordPinFailure(bruteKey);
    console.warn('[employe/verify-pin] aucun_employe', { ip, boutique_id });
    if (failResult.blocked) {
      return NextResponse.json(
        { error: ERR_TOO_MANY_ATTEMPTS },
        { status: 429, headers: { 'Retry-After': String(failResult.retryAfterSec) } },
      );
    }
    return NextResponse.json({ error: ERR_INVALID_CREDENTIALS }, { status: 401 });
  }

  // Find employee whose PIN matches (constant-time comparison)
  const pinHashLower = pin_hash.toLowerCase();
  let matchedEmploye: (typeof employes)[0] | null = null;

  for (const emp of employes) {
    if (!emp.pin || emp.pin.length !== 64) continue;
    try {
      const storedBuf = Buffer.from(emp.pin, 'hex');
      const receivedBuf = Buffer.from(pinHashLower, 'hex');
      if (
        storedBuf.length === 32 &&
        receivedBuf.length === 32 &&
        crypto.timingSafeEqual(storedBuf, receivedBuf)
      ) {
        matchedEmploye = emp;
        break;
      }
    } catch {
      // ignore malformed stored PIN
    }
  }

  if (!matchedEmploye) {
    const failResult = await recordPinFailure(bruteKey);
    console.warn('[employe/verify-pin] pin_invalide', { ip, boutique_id });
    if (failResult.blocked) {
      return NextResponse.json(
        { error: ERR_TOO_MANY_ATTEMPTS },
        { status: 429, headers: { 'Retry-After': String(failResult.retryAfterSec) } },
      );
    }
    return NextResponse.json({ error: ERR_INVALID_CREDENTIALS }, { status: 401 });
  }

  await clearPinFailures(bruteKey);

  const nomInitial =
    matchedEmploye.nom && matchedEmploye.nom.trim()
      ? matchedEmploye.nom.trim().charAt(0) + '.'
      : '';
  const displayNom = `${matchedEmploye.prenom}${nomInitial ? ' ' + nomInitial : ''}`.trim();
  const role = (matchedEmploye.role ?? 'caissier') as EmployeRole;

  const { token, expires_at } = createEmployeSessionToken({
    employe_id: matchedEmploye.id,
    employe_nom: displayNom,
    boutique_id: boutique.id,
    boutique_nom: boutique.nom,
    role,
  });

  console.info('[employe/verify-pin] connexion_reussie', {
    ip,
    boutique_id,
    employe_id: matchedEmploye.id,
    role,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    employe: {
      id: matchedEmploye.id,
      nom: matchedEmploye.nom,
      prenom: matchedEmploye.prenom,
      role,
    },
    boutique: {
      id: boutique.id,
      nom: boutique.nom,
    },
    session: {
      token,
      expires_at,
    },
  });
}
