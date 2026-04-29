import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { produitsPatchSchema } from '@/lib/schemas/produits';
import { revalidateUserCache } from '@/lib/revalidate';

type PatchBody = {
  stock_actuel?: number;
  prix_vente?: number;
  date_peremption?: string | null;
};

/**
 * PATCH /api/produits/[id]
 * Updates stock_actuel, prix_vente, and/or date_peremption for a product.
 * Only fields provided in the body are updated.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'id produit requis' }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(produitsPatchSchema, rawBody);
  if (validationError) return validationError;

  const update: PatchBody = {};
  if (body.stock_actuel !== undefined) update.stock_actuel = body.stock_actuel;
  if (body.prix_vente !== undefined) update.prix_vente = body.prix_vente;
  if ('date_peremption' in body) update.date_peremption = body.date_peremption ?? null;

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

  revalidateUserCache(user.id, ['alertes-stock', 'notifications', 'stocks-consolides', 'peremptions']);

  return NextResponse.json(data);
}
