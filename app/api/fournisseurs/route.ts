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
    const { fournisseur_id, boutique_id, montant, note } = body as {
      fournisseur_id: string;
      boutique_id: string;
      montant: number;
      note?: string;
    };

    if (!fournisseur_id || !boutique_id || montant == null) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('commandes_fournisseur')
      .insert({ fournisseur_id, boutique_id, montant, note: note ?? null })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  }

  // Create fournisseur
  const { nom, specialite, delai_livraison, note, telephone } = body as {
    nom: string;
    specialite?: string;
    delai_livraison?: string;
    note?: number;
    telephone?: string;
  };

  if (!nom) {
    return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('fournisseurs')
    .insert({
      proprietaire_id: user.id,
      nom,
      specialite: specialite ?? null,
      delai_livraison: delai_livraison ?? null,
      note: note ?? 0,
      telephone: telephone ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
