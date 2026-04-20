/**
 * POST /api/employes/[id]/reset-pin
 *
 * Resets the employee PIN to a new random 4-digit PIN.
 * Proprietaire-only. Returns the new PIN in plaintext (shown once).
 *
 * Response 200: { pin: string } — the new PIN in plaintext
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: employe, error: fetchError } = await admin
    .from('employes')
    .select('id, proprietaire_id')
    .eq('id', id)
    .single();

  if (fetchError || !employe) {
    return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 });
  }

  if (employe.proprietaire_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  // Generate a random 4-digit PIN
  const pin = String(1000 + (crypto.randomInt(0, 9000)));

  // SHA-256 hash the PIN server-side
  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

  const { error: updateError } = await admin
    .from('employes')
    .update({
      pin: pinHash,
      failed_pin_attempts: 0,
      locked_until: null,
    })
    .eq('id', id);

  if (updateError) {
    console.error('[api/employes/reset-pin]', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Return the new PIN in plaintext (shown once to the proprietaire)
  return NextResponse.json({ pin });
}
