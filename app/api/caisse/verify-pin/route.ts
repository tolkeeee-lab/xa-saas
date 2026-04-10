/**
 * POST /api/caisse/verify-pin
 *
 * Vérifie le PIN d'un propriétaire ou d'un employé sans exposer le hash stocké.
 *
 * Body JSON :
 *   { boutique_id: string, type: 'proprietaire' | 'employe', employe_id?: string, pin: string }
 *
 * Réponse :
 *   { valid: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createAdminClient } from '../../../../lib/supabase-admin';

function serverHashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

export async function POST(request: NextRequest) {
  let body: { boutique_id?: string; type?: string; employe_id?: string; pin?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { boutique_id, type, employe_id, pin } = body;

  if (!boutique_id || !type || !pin) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ valid: false });
  }

  const inputHash = serverHashPin(pin);
  const supabase = createAdminClient();

  if (type === 'proprietaire') {
    const { data, error } = await supabase
      .from('boutiques')
      .select('pin_caisse')
      .eq('id', boutique_id)
      .single();
    if (error || !data) return NextResponse.json({ valid: false });
    return NextResponse.json({ valid: data.pin_caisse === inputHash });
  }

  if (type === 'employe') {
    if (!employe_id) return NextResponse.json({ valid: false });
    const { data, error } = await supabase
      .from('employes')
      .select('pin')
      .eq('id', employe_id)
      .eq('boutique_id', boutique_id)
      .single();
    if (error || !data) return NextResponse.json({ valid: false });
    return NextResponse.json({ valid: data.pin === inputHash });
  }

  return NextResponse.json({ error: 'type invalide' }, { status: 400 });
}
