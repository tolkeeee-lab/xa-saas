import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { ChargeFixe } from '@/types/database';

type PostBody = {
  libelle?: string;
  categorie?: ChargeFixe['categorie'];
  boutique_id?: string | null;
  montant?: number;
  periodicite?: ChargeFixe['periodicite'];
};

/**
 * GET /api/charges-fixes
 * Returns all charges fixes for the authenticated owner.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('charges_fixes')
    .select('*')
    .eq('proprietaire_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/charges-fixes
 * Creates a new charge fixe.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { libelle, categorie, boutique_id, montant, periodicite } = body;

  if (!libelle || !categorie || montant == null) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  const VALID_CATEGORIES: ChargeFixe['categorie'][] = ['loyer', 'salaire', 'fournisseur', 'autre'];
  const VALID_PERIODICITES: ChargeFixe['periodicite'][] = ['mensuel', 'hebdo', 'annuel'];

  if (!VALID_CATEGORIES.includes(categorie)) {
    return NextResponse.json({ error: 'Catégorie invalide' }, { status: 422 });
  }
  if (periodicite && !VALID_PERIODICITES.includes(periodicite)) {
    return NextResponse.json({ error: 'Périodicité invalide' }, { status: 422 });
  }
  if (typeof montant !== 'number' || montant < 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('charges_fixes')
    .insert({
      proprietaire_id: user.id,
      boutique_id: boutique_id ?? null,
      libelle,
      categorie,
      montant,
      periodicite: periodicite ?? 'mensuel',
      actif: true,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
