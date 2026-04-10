/**
 * GET /api/caisse/employes?boutique_id=XXX
 *
 * Retourne les employés actifs d'une boutique.
 * N'expose jamais le pin des employés.
 * Utilise la clé service-role pour contourner les RLS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase-admin';

export async function GET(request: NextRequest) {
  const boutiqueId = request.nextUrl.searchParams.get('boutique_id');
  if (!boutiqueId) {
    return NextResponse.json({ error: 'boutique_id requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('employes')
    .select('id, nom, prenom, role')
    .eq('boutique_id', boutiqueId)
    .eq('actif', true)
    .order('nom');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ employes: data ?? [] });
}
