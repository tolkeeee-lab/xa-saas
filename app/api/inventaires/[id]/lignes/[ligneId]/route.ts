import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { inventaireLignePatchSchema } from '@/lib/schemas/inventaires';
import { revalidateUserCache } from '@/lib/revalidate';

/**
 * PATCH /api/inventaires/[id]/lignes/[ligneId] — mettre à jour le stock_compte
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ligneId: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const { id, ligneId } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(inventaireLignePatchSchema, rawBody);
  if (validationError) return validationError;

  const admin = createAdminClient();

  // Vérifier ownership via l'inventaire parent
  const { data: inventaire } = await admin
    .from('inventaires')
    .select('id, statut, proprietaire_id')
    .eq('id', id)
    .single();

  if (!inventaire) {
    return NextResponse.json({ error: 'Inventaire introuvable' }, { status: 404 });
  }

  if ((inventaire.proprietaire_id as string) !== user.id) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  if ((inventaire.statut as string) !== 'en_cours') {
    return NextResponse.json({ error: 'L\'inventaire n\'est plus en cours' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('inventaire_lignes')
    .update({ stock_compte: body.stock_compte })
    .eq('id', ligneId)
    .eq('inventaire_id', id)
    .select('id, inventaire_id, produit_id, stock_theorique, stock_compte, ecart, prix_vente_snapshot, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['inventaires']);

  return NextResponse.json(data);
}
