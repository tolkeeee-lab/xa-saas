import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

type TransfertBody = {
  produit_id?: string;
  boutique_source_id?: string;
  boutique_destination_id?: string;
  quantite?: number;
  note?: string;
};

/**
 * GET /api/transferts?boutique_ids=id1,id2
 * Returns transfers involving the given boutique IDs.
 */
export async function GET(request: NextRequest) {
  const boutiqueIds = request.nextUrl.searchParams.get('boutique_ids');
  if (!boutiqueIds) {
    return NextResponse.json({ error: 'boutique_ids requis' }, { status: 400 });
  }

  const ids = boutiqueIds.split(',').filter(Boolean);
  if (!ids.length) {
    return NextResponse.json([], { status: 200 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('transferts')
    .select('*')
    .or(
      `boutique_source_id.in.(${ids.join(',')}),boutique_destination_id.in.(${ids.join(',')})`,
    )
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/transferts
 * Creates a new inter-site transfer.
 * Body: { produit_id, boutique_source_id, boutique_destination_id, quantite, note? }
 */
export async function POST(request: NextRequest) {
  let body: TransfertBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { produit_id, boutique_source_id, boutique_destination_id, quantite, note } = body;

  if (!produit_id || !boutique_source_id || !boutique_destination_id || quantite == null) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  if (boutique_source_id === boutique_destination_id) {
    return NextResponse.json(
      { error: 'La source et la destination doivent être différentes' },
      { status: 422 },
    );
  }

  if (!Number.isInteger(quantite) || quantite <= 0) {
    return NextResponse.json({ error: 'La quantité doit être un entier positif' }, { status: 422 });
  }

  const supabase = createAdminClient();

  // Verify source stock
  const { data: produit, error: produitError } = await supabase
    .from('produits')
    .select('id, stock_actuel, boutique_id')
    .eq('id', produit_id)
    .eq('boutique_id', boutique_source_id)
    .single();

  if (produitError || !produit) {
    return NextResponse.json(
      { error: 'Produit introuvable dans la boutique source' },
      { status: 404 },
    );
  }

  if (produit.stock_actuel < quantite) {
    return NextResponse.json(
      { error: `Stock insuffisant (disponible : ${produit.stock_actuel})` },
      { status: 422 },
    );
  }

  // Verify destination boutique has this product
  const { data: produitDest } = await supabase
    .from('produits')
    .select('id, stock_actuel')
    .eq('id', produit_id)
    .eq('boutique_id', boutique_destination_id)
    .maybeSingle();

  // Insert transfer
  const { data: transfert, error: txError } = await supabase
    .from('transferts')
    .insert({
      produit_id,
      boutique_source_id,
      boutique_destination_id,
      quantite,
      note: note ?? null,
      statut: 'en_transit',
    })
    .select('*')
    .single();

  if (txError || !transfert) {
    return NextResponse.json({ error: txError?.message ?? 'Erreur transfert' }, { status: 500 });
  }

  // Decrement source stock
  const { error: srcError } = await supabase
    .from('produits')
    .update({ stock_actuel: produit.stock_actuel - quantite })
    .eq('id', produit_id)
    .eq('boutique_id', boutique_source_id);

  if (srcError) {
    return NextResponse.json({ error: srcError.message }, { status: 500 });
  }

  // Increment destination stock if product exists there
  if (produitDest) {
    await supabase
      .from('produits')
      .update({ stock_actuel: produitDest.stock_actuel + quantite })
      .eq('id', produit_id)
      .eq('boutique_id', boutique_destination_id);
  }

  return NextResponse.json(transfert, { status: 201 });
}
