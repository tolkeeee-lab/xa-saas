import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/fournisseurs  → liste fournisseurs du propriétaire authentifié
 * POST /api/fournisseurs → créer un fournisseur
 * POST /api/fournisseurs?action=commande → créer une commande fournisseur
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
    .from('fournisseurs')
    .select('*')
    .eq('proprietaire_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const admin = createAdminClient();

  if (action === 'commande') {
    const fournisseur_id = typeof body.fournisseur_id === 'string' ? body.fournisseur_id : '';
    const boutique_id = typeof body.boutique_id === 'string' ? body.boutique_id : '';
    const montant = typeof body.montant === 'number' ? body.montant : 0;
    const note = typeof body.note === 'string' ? body.note : null;

    if (!fournisseur_id || !boutique_id || !montant) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('commandes_fournisseur')
      .insert({
        fournisseur_id,
        boutique_id,
        montant,
        note,
        statut: 'en_attente' as const,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  }

  // Create fournisseur
  const nom = typeof body.nom === 'string' ? body.nom : '';
  const specialite = typeof body.specialite === 'string' ? body.specialite : null;
  const delai_livraison = typeof body.delai_livraison === 'string' ? body.delai_livraison : null;
  const noteVal = typeof body.note === 'number' ? body.note : 0;
  const telephone = typeof body.telephone === 'string' ? body.telephone : null;

  if (!nom) {
    return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('fournisseurs')
    .insert({
      proprietaire_id: user.id,
      nom,
      specialite,
      delai_livraison,
      note: noteVal,
      telephone,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}