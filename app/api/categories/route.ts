import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { categoriesPostSchema } from '@/lib/schemas/categories';
import { revalidateUserCache } from '@/lib/revalidate';

/**
 * GET /api/categories → liste les catégories du proprio connecté, ordonnées par ordre ASC, nom ASC
 * POST /api/categories → crée une catégorie { nom, icone?, couleur? }
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
    .from('categories_produits')
    .select('*')
    .eq('proprietaire_id', user.id)
    .order('ordre', { ascending: true })
    .order('nom', { ascending: true });

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

  const { data: body, error: validationError } = validateBody(categoriesPostSchema, rawBody);
  if (validationError) return validationError;

  const admin = createAdminClient();

  // Compute next ordre value
  const { data: existing } = await admin
    .from('categories_produits')
    .select('ordre')
    .eq('proprietaire_id', user.id)
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrdre = existing ? existing.ordre + 1 : 1;

  const { data, error } = await admin
    .from('categories_produits')
    .insert({
      proprietaire_id: user.id,
      nom: body.nom.trim(),
      icone: body.icone ?? '📦',
      couleur: body.couleur ?? '#999999',
      ordre: nextOrdre,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cette catégorie existe déjà.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['categories']);

  return NextResponse.json(data, { status: 201 });
}
