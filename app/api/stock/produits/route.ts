import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/stock/produits?boutique_id=xxx&tab=tous|bas|rupture|perime&q=search&page=1
 * Returns paginated products (50/page) for the given boutique.
 */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const role = await getEffectiveRole();
  if (!role) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const boutique_id = searchParams.get('boutique_id');
  const tab = searchParams.get('tab') ?? 'tous';
  const q = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = 50;
  const offset = (page - 1) * limit;

  if (!boutique_id || !/^[0-9a-f-]{36}$/.test(boutique_id)) {
    return NextResponse.json({ error: 'boutique_id invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── Auth check ────────────────────────────────────────────────────────────
  if (role.role !== 'admin') {
    const { data: boutique } = await admin
      .from('boutiques')
      .select('id, proprietaire_id')
      .eq('id', boutique_id)
      .maybeSingle();
    if (!boutique) return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });
    const isOwner = boutique.proprietaire_id === role.userId;
    const isEmployee = role.boutiqueIdAssignee === boutique_id;
    if (!isOwner && !isEmployee) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
  }

  // ── Build query ───────────────────────────────────────────────────────────
  let query = admin
    .from('produits')
    .select('*', { count: 'exact' })
    .eq('boutique_id', boutique_id)
    .eq('actif', true)
    .order('nom')
    .range(offset, offset + limit - 1);

  if (q) query = query.ilike('nom', `%${q}%`);

  const now = new Date().toISOString();
  if (tab === 'bas') {
    // stock_actuel > 0 and <= seuil_alerte
    query = query.gt('stock_actuel', 0).lte('stock_actuel', 5); // approximate; real filter below
  } else if (tab === 'rupture') {
    query = query.lte('stock_actuel', 0);
  } else if (tab === 'perime') {
    query = query.not('date_peremption', 'is', null).lt('date_peremption', now);
  }

  const { data: produits, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // For 'bas' tab: filter accurately using individual seuil_alerte
  const finalProduits = tab === 'bas'
    ? (produits ?? []).filter((p) => p.stock_actuel > 0 && p.stock_actuel <= p.seuil_alerte)
    : produits ?? [];

  return NextResponse.json({
    produits: finalProduits,
    total: count ?? 0,
    page,
    hasMore: offset + limit < (count ?? 0),
  });
}
