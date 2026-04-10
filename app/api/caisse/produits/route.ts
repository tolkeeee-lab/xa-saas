/**
 * GET /api/caisse/produits?boutique_id=XXX
 *
 * Retourne les produits actifs d'une boutique (id, nom, prix_unitaire, stock_actuel, unite).
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
    .from('produits')
    .select('id, nom, prix_unitaire, stock_actuel, unite')
    .eq('boutique_id', boutiqueId)
    .eq('actif', true)
    .order('nom');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ produits: data ?? [] });
}
