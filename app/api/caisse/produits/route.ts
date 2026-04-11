import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ProduitPublic } from '@/types/database';

export async function GET(request: NextRequest) {
  const boutiqueId = request.nextUrl.searchParams.get('boutique_id');
  if (!boutiqueId) return NextResponse.json({ error: 'boutique_id requis' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('produits')
    .select('id, boutique_id, nom, prix_vente, stock_actuel, unite')
    .eq('boutique_id', boutiqueId)
    .eq('actif', true)
    .gt('stock_actuel', 0)
    .order('nom');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []) as ProduitPublic[]);
}
