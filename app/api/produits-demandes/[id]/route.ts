import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import type { ProduitsDemandes } from '@/types/database';

/**
 * PATCH /api/produits-demandes/[id]
 * Body: { statut?, note?, prix_indicatif?, categorie? }
 * If statut === 'resolu' → set resolved_at + resolved_by
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;

  let body: {
    statut?: ProduitsDemandes['statut'];
    note?: string;
    prix_indicatif?: number;
    categorie?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify ownership via boutique
  const { data: demande } = await admin
    .from('produits_demandes')
    .select('id, boutique_id')
    .eq('id', id)
    .maybeSingle();

  if (!demande) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  }

  const { data: ownedBoutique } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', demande.boutique_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!ownedBoutique) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const VALID_STATUTS = ['en_attente', 'resolu', 'rejete'] as const;
  type Statut = (typeof VALID_STATUTS)[number];

  type DemandeUpdate = Partial<Omit<ProduitsDemandes, 'id'>>;
  const updatePayload: DemandeUpdate = {};

  if (body.statut && (VALID_STATUTS as readonly string[]).includes(body.statut)) {
    updatePayload.statut = body.statut as Statut;
    if (body.statut === 'resolu') {
      updatePayload.resolved_at = new Date().toISOString();
      updatePayload.resolved_by = user.id;
    }
  }
  if (body.note !== undefined) updatePayload.note = body.note;
  if (body.prix_indicatif !== undefined) updatePayload.prix_indicatif = body.prix_indicatif;
  if (body.categorie !== undefined) updatePayload.categorie = body.categorie;

  const { data: updated, error } = await admin
    .from('produits_demandes')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: updated as ProduitsDemandes });
}

/**
 * DELETE /api/produits-demandes/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;

  const admin = createAdminClient();

  // Verify ownership
  const { data: demande } = await admin
    .from('produits_demandes')
    .select('id, boutique_id')
    .eq('id', id)
    .maybeSingle();

  if (!demande) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  }

  const { data: ownedBoutique } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', demande.boutique_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!ownedBoutique) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { error } = await admin.from('produits_demandes').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
