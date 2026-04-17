import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { fournisseursPostSchema, commandeFournisseurSchema } from '@/lib/schemas/fournisseurs';
import { revalidateUserCache } from '@/lib/revalidate';

/**
 * GET /api/fournisseurs  → liste fournisseurs du propriétaire authentifié
 * POST /api/fournisseurs → créer un fournisseur
 * POST /api/fournisseurs?action=commande → créer une commande fournisseur
 */

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

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
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const admin = createAdminClient();

  if (action === 'commande') {
    const { data: body, error: validationError } = validateBody(
      commandeFournisseurSchema,
      rawBody,
    );
    if (validationError) return validationError;

    const { fournisseur_id, boutique_id, montant, note } = body;

    const { data, error } = await admin
      .from('commandes_fournisseur')
      .insert({
        fournisseur_id,
        boutique_id,
        montant,
        note: note ?? null,
        statut: 'en_attente' as const,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateUserCache(user.id, ['fournisseurs']);

    return NextResponse.json(data, { status: 201 });
  }

  const { data: body, error: validationError } = validateBody(fournisseursPostSchema, rawBody);
  if (validationError) return validationError;

  const { nom, specialite, delai_livraison, note: noteVal, telephone } = body;

  const { data, error } = await admin
    .from('fournisseurs')
    .insert({
      proprietaire_id: user.id,
      nom,
      specialite: specialite ?? null,
      delai_livraison: delai_livraison ?? null,
      note: noteVal ?? 0,
      telephone: telephone ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['fournisseurs']);

  return NextResponse.json(data, { status: 201 });
}