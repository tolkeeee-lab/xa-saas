import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { produitsPostSchema } from '@/lib/schemas/produits';
import { revalidateUserCache } from '@/lib/revalidate';
import { detectCategorie } from '@/lib/detectCategorie';

/**
 * GET /api/produits?boutique_id=xxx
 * Returns products for the given boutique WITHOUT prix_achat.
 */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
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
 * Body: { boutique_id, nom, prix_achat, prix_vente, stock_actuel, seuil_alerte, unite? }
 * Note: categorie is auto-detected from nom if not provided or is 'Général'.
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

  const { data: body, error: validationError } = validateBody(produitsPostSchema, rawBody);
  if (validationError) return validationError;

  const {
    boutique_id,
    nom,
    categorie,
    prix_achat: prix_achat_input,
    prix_vente,
    stock_actuel,
    seuil_alerte,
    unite,
    mode_achat,
    qty_par_lot,
    prix_lot_achat,
    lot_label,
    unite_label,
  } = body;

  // Compute prix_achat (unit purchase price) from lot if needed
  const effectiveModeAchat = mode_achat ?? 'unite';

  // Auto-detect category from product name if not explicitly provided
  const effectiveCategorie =
    categorie?.trim() && categorie.trim() !== 'Général'
      ? categorie.trim()
      : detectCategorie(nom);

  let prix_achat: number;
  if (effectiveModeAchat === 'lot' && prix_lot_achat != null && qty_par_lot) {
    prix_achat = Math.round((prix_lot_achat / qty_par_lot) * 100) / 100;
  } else {
    prix_achat = prix_achat_input ?? 0;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('produits')
    .insert({
      boutique_id,
      nom: nom.trim(),
      categorie: effectiveCategorie,
      description: null,
      prix_achat,
      prix_vente,
      stock_actuel: stock_actuel ?? 0,
      seuil_alerte: seuil_alerte ?? 5,
      unite: unite ?? unite_label ?? 'unité', // unite_label used as fallback when unite not explicitly set
      actif: true,
      mode_achat: effectiveModeAchat,
      qty_par_lot: qty_par_lot ?? null,
      prix_lot_achat: prix_lot_achat ?? null,
      lot_label: lot_label ?? null,
      unite_label: unite_label ?? null,
    })
    .select('id, boutique_id, nom, categorie, description, prix_vente, stock_actuel, seuil_alerte, unite, actif, mode_achat, qty_par_lot, lot_label, unite_label, created_at, updated_at')
    .single();

  // If INSERT failed because the conditionnement columns don't exist yet (migration pending),
  // fall back to a basic INSERT without those columns so the product can still be saved.
  if (error) {
    // Postgres error code 42703 = "column does not exist"
    if (error.code === '42703') {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('produits')
        .insert({
          boutique_id,
          nom: nom.trim(),
          categorie: effectiveCategorie,
          description: null,
          prix_achat,
          prix_vente,
          stock_actuel: stock_actuel ?? 0,
          seuil_alerte: seuil_alerte ?? 5,
          unite: unite ?? unite_label ?? 'unité',
          actif: true,
        })
        .select('id, boutique_id, nom, categorie, description, prix_vente, stock_actuel, seuil_alerte, unite, actif, created_at, updated_at')
        .single();

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      revalidateUserCache(user.id, ['alertes-stock', 'stocks-consolides', 'peremptions']);
      return NextResponse.json(fallbackData, { status: 201 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['alertes-stock', 'stocks-consolides', 'peremptions']);

  return NextResponse.json(data, { status: 201 });
}
