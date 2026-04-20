import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { categoriesPatchSchema } from '@/lib/schemas/categories';
import { revalidateUserCache } from '@/lib/revalidate';
import type { CategorieProduit } from '@/types/database';

/**
 * PATCH /api/categories/[id] → update { nom?, icone?, couleur?, ordre? }
 * DELETE /api/categories/[id] → supprime la catégorie;
 *   les produits utilisant cette catégorie sont basculés vers "Général"
 */

type CategorieUpdate = Partial<Omit<CategorieProduit, 'id' | 'proprietaire_id' | 'created_at'>>;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { id } = await params;

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

  const { data: body, error: validationError } = validateBody(categoriesPatchSchema, rawBody);
  if (validationError) return validationError;

  const admin = createAdminClient();

  // Verify ownership
  const { data: existing, error: fetchError } = await admin
    .from('categories_produits')
    .select('id, nom, proprietaire_id')
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });
  }

  const updatePayload: CategorieUpdate = {
    updated_at: new Date().toISOString(),
  };
  if (body.nom !== undefined) updatePayload.nom = body.nom.trim();
  if (body.icone !== undefined) updatePayload.icone = body.icone;
  if (body.couleur !== undefined) updatePayload.couleur = body.couleur;
  if (body.ordre !== undefined) updatePayload.ordre = body.ordre;

  const { data, error } = await admin
    .from('categories_produits')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cette catégorie existe déjà.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['categories']);

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Verify ownership
  const { data: existing, error: fetchError } = await admin
    .from('categories_produits')
    .select('id, nom, proprietaire_id')
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });
  }

  // Prevent deleting "Général" if it's the fallback
  if (existing.nom === 'Général') {
    return NextResponse.json(
      { error: 'La catégorie "Général" ne peut pas être supprimée car elle est la catégorie de secours.' },
      { status: 400 },
    );
  }

  // Get boutique IDs belonging to this proprietaire
  const { data: boutiques } = await admin
    .from('boutiques')
    .select('id')
    .eq('proprietaire_id', user.id);

  const boutiqueIds = (boutiques ?? []).map((b) => b.id);

  // Migrate products using this category to "Général"
  if (boutiqueIds.length > 0) {
    await admin
      .from('produits')
      .update({ categorie: 'Général', updated_at: new Date().toISOString() })
      .eq('categorie', existing.nom)
      .in('boutique_id', boutiqueIds);
  }

  const { error } = await admin
    .from('categories_produits')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['categories']);

  return NextResponse.json({ success: true });
}