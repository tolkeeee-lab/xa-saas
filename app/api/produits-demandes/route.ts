import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import type { ProduitsDemandes } from '@/types/database';

/**
 * GET /api/produits-demandes?boutique_id=X&statut=en_attente
 * Returns list of demandes for the boutique, sorted by nb_demandes desc, created_at desc
 */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const boutique_id = searchParams.get('boutique_id');
  const statut = searchParams.get('statut');

  if (!boutique_id) {
    return NextResponse.json({ error: 'boutique_id requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check boutique ownership
  const { data: ownedBoutique } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', boutique_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!ownedBoutique) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  let query = admin
    .from('produits_demandes')
    .select('*')
    .eq('boutique_id', boutique_id)
    .order('nb_demandes', { ascending: false })
    .order('created_at', { ascending: false });

  const VALID_STATUTS = ['en_attente', 'resolu', 'rejete'] as const;
  type Statut = (typeof VALID_STATUTS)[number];
  if (statut && (VALID_STATUTS as readonly string[]).includes(statut)) {
    query = query.eq('statut', statut as Statut);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count pending
  const { count: pendingCount } = await admin
    .from('produits_demandes')
    .select('id', { count: 'exact', head: true })
    .eq('boutique_id', boutique_id)
    .eq('statut', 'en_attente');

  return NextResponse.json({
    data: (data ?? []) as ProduitsDemandes[],
    pendingCount: pendingCount ?? 0,
  });
}

/**
 * POST /api/produits-demandes
 * Body: { boutique_id, nom_produit, categorie?, prix_indicatif?, client_nom?, note? }
 * Smart logic: if same nom_produit already exists (en_attente) → increment nb_demandes
 */
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: {
    boutique_id?: string;
    nom_produit?: string;
    categorie?: string;
    prix_indicatif?: number;
    client_nom?: string;
    note?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const { boutique_id, nom_produit, categorie, prix_indicatif, client_nom, note } = body;

  if (!boutique_id || !nom_produit?.trim()) {
    return NextResponse.json({ error: 'boutique_id et nom_produit sont requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check boutique ownership
  const { data: ownedBoutique } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', boutique_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!ownedBoutique) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const nomTrimmed = nom_produit.trim();

  // Check for existing en_attente demande with same name (case-insensitive)
  const { data: existing } = await admin
    .from('produits_demandes')
    .select('*')
    .eq('boutique_id', boutique_id)
    .eq('statut', 'en_attente')
    .ilike('nom_produit', nomTrimmed)
    .maybeSingle();

  if (existing) {
    // Increment nb_demandes
    type DemandeUpdate = Partial<Omit<ProduitsDemandes, 'id'>>;
    const updatePayload: DemandeUpdate = {
      nb_demandes: existing.nb_demandes + 1,
      updated_at: new Date().toISOString(),
    };
    if (client_nom) updatePayload.client_nom = client_nom;
    if (note) updatePayload.note = note;
    if (prix_indicatif != null) updatePayload.prix_indicatif = prix_indicatif;
    if (categorie) updatePayload.categorie = categorie;

    const { data: updated, error: updateError } = await admin
      .from('produits_demandes')
      .update(updatePayload)
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ data: updated as ProduitsDemandes, created: false });
  }

  // Create new demande
  const { data: created, error: insertError } = await admin
    .from('produits_demandes')
    .insert({
      boutique_id,
      nom_produit: nomTrimmed,
      categorie: categorie ?? null,
      prix_indicatif: prix_indicatif ?? null,
      client_nom: client_nom ?? null,
      note: note ?? null,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ data: created as ProduitsDemandes, created: true }, { status: 201 });
}
