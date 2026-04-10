/**
 * GET /api/caisse/boutique?code=XXX
 *
 * Retourne la boutique correspondant au code_unique donné.
 * N'expose jamais le pin_caisse.
 * Utilise la clé service-role pour contourner les RLS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase-admin';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code || code.trim().length < 4) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('boutiques')
    .select('id, nom, ville, adresse')
    .eq('code_unique', code.toUpperCase().trim())
    .eq('actif', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Code introuvable' }, { status: 404 });
  }

  return NextResponse.json({ boutiques: data });
}
