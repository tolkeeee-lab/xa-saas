import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import { revalidateUserCache } from '@/lib/revalidate';

const isUUID = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f-]{36}$/.test(v);

/**
 * POST /api/transferts/creer
 * Creates a new transfert_stock using RPC transferer_stock.
 * Body: { source_id, dest_id, produit_id, quantite }
 */
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const { source_id, dest_id, produit_id } = b;
  const quantite = typeof b.quantite === 'number' ? b.quantite : parseInt(String(b.quantite), 10);

  if (!isUUID(source_id)) return NextResponse.json({ error: 'source_id invalide' }, { status: 400 });
  if (!isUUID(dest_id)) return NextResponse.json({ error: 'dest_id invalide' }, { status: 400 });
  if (!isUUID(produit_id)) return NextResponse.json({ error: 'produit_id invalide' }, { status: 400 });
  if (!Number.isFinite(quantite) || quantite <= 0) {
    return NextResponse.json({ error: 'quantite doit être > 0' }, { status: 400 });
  }
  if (source_id === dest_id) {
    return NextResponse.json({ error: 'Source et destination doivent être différentes' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify ownership of source boutique
  const { data: sourceBoutique } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', source_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!sourceBoutique) {
    return NextResponse.json({ error: 'Accès refusé à la boutique source' }, { status: 403 });
  }

  // Verify destination boutique belongs to same owner
  const { data: destBoutique } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', dest_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!destBoutique) {
    return NextResponse.json({ error: 'Accès refusé à la boutique destination' }, { status: 403 });
  }

  // Verify produit exists in source boutique
  const { data: produit } = await admin
    .from('produits')
    .select('id, stock_actuel')
    .eq('id', produit_id)
    .eq('boutique_id', source_id)
    .maybeSingle();

  if (!produit) {
    return NextResponse.json({ error: 'Produit introuvable dans la boutique source' }, { status: 404 });
  }

  if (produit.stock_actuel < quantite) {
    return NextResponse.json(
      { error: `Stock insuffisant (disponible : ${produit.stock_actuel})` },
      { status: 422 },
    );
  }

  // Call RPC transferer_stock
  const { data: transfert, error: rpcError } = await admin.rpc('transferer_stock', {
    p_source: source_id,
    p_dest: dest_id,
    p_produit: produit_id,
    p_qty: quantite,
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['transferts', 'notifications', 'alertes-stock', 'stocks-consolides']);

  return NextResponse.json({ data: transfert }, { status: 201 });
}
