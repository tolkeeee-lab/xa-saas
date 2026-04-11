import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { ChargeFixe } from '@/types/database';

type PatchBody = {
  libelle?: string;
  categorie?: ChargeFixe['categorie'];
  boutique_id?: string | null;
  montant?: number;
  periodicite?: ChargeFixe['periodicite'];
  actif?: boolean;
};

/**
 * PATCH /api/charges-fixes/[id]
 * Updates a charge fixe.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const VALID_CATEGORIES: ChargeFixe['categorie'][] = ['loyer', 'salaire', 'fournisseur', 'autre'];
  const VALID_PERIODICITES: ChargeFixe['periodicite'][] = ['mensuel', 'hebdo', 'annuel'];

  const update: PatchBody = {};
  if (body.libelle !== undefined) update.libelle = body.libelle;
  if (body.categorie !== undefined) {
    if (!VALID_CATEGORIES.includes(body.categorie)) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 422 });
    }
    update.categorie = body.categorie;
  }
  if (body.boutique_id !== undefined) update.boutique_id = body.boutique_id;
  if (body.montant !== undefined) {
    if (typeof body.montant !== 'number' || body.montant < 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 422 });
    }
    update.montant = body.montant;
  }
  if (body.periodicite !== undefined) {
    if (!VALID_PERIODICITES.includes(body.periodicite)) {
      return NextResponse.json({ error: 'Périodicité invalide' }, { status: 422 });
    }
    update.periodicite = body.periodicite;
  }
  if (body.actif !== undefined) update.actif = body.actif;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ensure charge belongs to this user
  const { data: existing } = await admin
    .from('charges_fixes')
    .select('id, proprietaire_id')
    .eq('id', id)
    .single();

  if (!existing || existing.proprietaire_id !== user.id) {
    return NextResponse.json({ error: 'Charge introuvable' }, { status: 404 });
  }

  const { data, error } = await admin
    .from('charges_fixes')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/charges-fixes/[id]
 * Deletes a charge fixe.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Ensure charge belongs to this user
  const { data: existing } = await admin
    .from('charges_fixes')
    .select('id, proprietaire_id')
    .eq('id', id)
    .single();

  if (!existing || existing.proprietaire_id !== user.id) {
    return NextResponse.json({ error: 'Charge introuvable' }, { status: 404 });
  }

  const { error } = await admin.from('charges_fixes').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
