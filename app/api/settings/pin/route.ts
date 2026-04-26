import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase-admin';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { applyRateLimit } from '@/lib/rateLimit';

const PIN_HASH_RE = /^[0-9a-f]{64}$/i;

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * POST /api/settings/pin
 * Changes the employe's PIN. oldPin and newPin must be SHA-256 hex hashes.
 * Body: { oldPin: string (SHA-256 hex), newPin: string (SHA-256 hex) }
 */
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const role = await getEffectiveRole();
  if (!role) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  if (role.role !== 'manager' && role.role !== 'staff') {
    return NextResponse.json(
      { error: 'Le changement de PIN est réservé aux gérants et caissiers.' },
      { status: 403 },
    );
  }

  if (!role.employeId) {
    return NextResponse.json({ error: 'Employé introuvable.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { oldPin, newPin } = (body ?? {}) as { oldPin?: unknown; newPin?: unknown };

  if (typeof oldPin !== 'string' || !PIN_HASH_RE.test(oldPin)) {
    return NextResponse.json({ error: 'oldPin invalide (SHA-256 hex attendu)' }, { status: 400 });
  }
  if (typeof newPin !== 'string' || !PIN_HASH_RE.test(newPin)) {
    return NextResponse.json({ error: 'newPin invalide (SHA-256 hex attendu)' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: employe, error: fetchError } = await admin
    .from('employes')
    .select('id, pin_hash, pin')
    .eq('id', role.employeId)
    .single();

  if (fetchError || !employe) {
    return NextResponse.json({ error: 'Employé introuvable.' }, { status: 404 });
  }

  // Verify old PIN: check against pin_hash (MAFRO v4) or legacy pin field
  const storedHash = employe.pin_hash ?? (employe.pin ? sha256Hex(employe.pin) : null);
  if (!storedHash || storedHash.toLowerCase() !== oldPin.toLowerCase()) {
    return NextResponse.json({ error: 'Ancien PIN incorrect.' }, { status: 403 });
  }

  const { error: updateError } = await admin
    .from('employes')
    .update({ pin_hash: newPin.toLowerCase() })
    .eq('id', role.employeId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
