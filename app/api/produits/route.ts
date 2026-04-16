import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { produitsPostSchema } from '@/lib/schemas/produits';
import { revalidateUserCache } from '@/lib/revalidate';

/**
 * GET /api/produits?boutique_id=xxx
 * Returns products for the given boutique WITHOUT prix_achat.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request);
  if (limited) return limited;

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
  const limited = applyRateLimit(request);
  if (limited) return limited;

  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(produitsPostSchema, rawBody);
  if (validationError) return validationError;

  const { boutique_id, nom, categorie, prix_achat, prix_vente, stock_actuel, seuil_alerte, unite } = body;

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

  revalidateUserCache(user.id, ['alertes-stock', 'stocks-consolides', 'peremptions']);

  return NextResponse.json(data, { status: 201 });
}
