import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';

/**
 * GET /api/produits?boutique_id=xxx
 * Returns products for the given boutique WITHOUT prix_achat.
 */
export async function GET(request: NextRequest) {
  const { error: authError } = await getAuthUser();
  if (authError) return authError;

  const boutiqueId = request.nextUrl.searchParams.get('boutique_id');
  if (!boutiqueId) {
    return NextResponse.json({ error: 'boutique_id requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('produits')
    .select(
      'id, boutique_id, nom, categorie, description, prix_vente, stock_actuel, seuil_alerte, unite, actif, created_at, updated_at',
    )
    .eq('boutique_id', boutiqueId)
    .eq('actif', true)
    .order('nom', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/produits
 * Creates a new product.
 * Body: { boutique_id, nom, categorie, prix_achat, prix_vente, stock_actuel, seuil_alerte, unite? }
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await getAuthUser();
  if (authError) return authError;

  let body: {
    boutique_id?: string;
    nom?: string;
    categorie?: string;
    prix_achat?: number;
    prix_vente?: number;
    stock_actuel?: number;
    seuil_alerte?: number;
    unite?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { boutique_id, nom, categorie, prix_achat, prix_vente, stock_actuel, seuil_alerte, unite } = body;

  if (!boutique_id || !nom || prix_achat == null || prix_vente == null) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  if (prix_vente <= prix_achat) {
    return NextResponse.json({ error: "Le prix de vente doit être supérieur au prix d'achat" }, { status: 422 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('produits')
    .insert({
      boutique_id,
      nom: nom.trim(),
      categorie: categorie?.trim() ?? 'Général',
      description: null,
      prix_achat,
      prix_vente,
      stock_actuel: stock_actuel ?? 0,
      seuil_alerte: seuil_alerte ?? 5,
      unite: unite ?? 'unité',
      actif: true,
    })
    .select('id, boutique_id, nom, categorie, description, prix_vente, stock_actuel, seuil_alerte, unite, actif, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
