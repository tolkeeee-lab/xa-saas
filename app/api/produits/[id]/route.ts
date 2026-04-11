import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

type PatchBody = {
  stock_actuel?: number;
  prix_vente?: number;
};

/**
 * PATCH /api/produits/[id]
 * Updates stock_actuel and/or prix_vente for a product.
 * Only fields provided in the body are updated.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'id produit requis' }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const update: PatchBody = {};
  if (body.stock_actuel !== undefined) update.stock_actuel = body.stock_actuel;
  if (body.prix_vente !== undefined) update.prix_vente = body.prix_vente;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('produits')
    .update(update)
    .eq('id', id)
    .select('id, boutique_id, nom, categorie, description, prix_vente, stock_actuel, seuil_alerte, unite, actif, date_peremption, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
