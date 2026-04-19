import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { inventairePostSchema } from '@/lib/schemas/inventaires';
import { revalidateUserCache } from '@/lib/revalidate';

/**
 * POST /api/inventaires — créer un nouvel inventaire
 */
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(inventairePostSchema, rawBody);
  if (validationError) return validationError;

  const admin = createAdminClient();

  // Vérifier que la boutique appartient bien à l'utilisateur
  const { data: boutique } = await admin
    .from('boutiques')
    .select('id, proprietaire_id')
    .eq('id', body.boutique_id)
    .eq('proprietaire_id', user.id)
    .single();

  if (!boutique) {
    return NextResponse.json({ error: 'Boutique introuvable ou non autorisée' }, { status: 403 });
  }

  // Créer l'inventaire
  const { data: inventaire, error: invError } = await admin
    .from('inventaires')
    .insert({
      boutique_id: body.boutique_id,
      proprietaire_id: user.id,
      created_by: user.id,
      perimetre: body.perimetre,
      categorie: body.categorie ?? null,
      note: body.note ?? null,
      statut: 'en_cours',
    })
    .select()
    .single();

  if (invError || !inventaire) {
    return NextResponse.json({ error: invError?.message ?? 'Erreur création inventaire' }, { status: 500 });
  }

  // Récupérer les produits selon le périmètre
  let produitsQuery = admin
    .from('produits')
    .select('id, stock_actuel, prix_vente')
    .eq('boutique_id', body.boutique_id)
    .eq('actif', true);

  if (body.perimetre === 'categorie' && body.categorie) {
    produitsQuery = produitsQuery.eq('categorie', body.categorie);
  } else if (body.perimetre === 'selection' && body.produit_ids?.length) {
    produitsQuery = produitsQuery.in('id', body.produit_ids);
  }

  const { data: produits } = await produitsQuery;

  if (!produits?.length) {
    // Pas de produits → annuler et retourner erreur
    await admin.from('inventaires').delete().eq('id', inventaire.id);
    return NextResponse.json({ error: 'Aucun produit actif trouvé pour ce périmètre' }, { status: 400 });
  }

  // Bulk insert des lignes
  const lignes = produits.map((p) => ({
    inventaire_id: inventaire.id as string,
    produit_id: p.id as string,
    stock_theorique: p.stock_actuel as number,
    prix_vente_snapshot: p.prix_vente as number,
  }));

  const { error: lignesError } = await admin.from('inventaire_lignes').insert(lignes);

  if (lignesError) {
    await admin.from('inventaires').delete().eq('id', inventaire.id);
    return NextResponse.json({ error: lignesError.message }, { status: 500 });
  }

  // Mettre à jour nb_produits
  const { data: updatedInv, error: updateError } = await admin
    .from('inventaires')
    .update({ nb_produits: produits.length })
    .eq('id', inventaire.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['inventaires']);

  return NextResponse.json(updatedInv, { status: 201 });
}
