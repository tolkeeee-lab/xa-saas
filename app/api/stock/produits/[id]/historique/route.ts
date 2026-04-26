import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/stock/produits/[id]/historique?boutique_id=xxx&limit=30
 * Returns the last N movements for a product, with user initials.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const role = await getEffectiveRole();
  if (!role) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id: produitId } = await context.params;
  const { searchParams } = new URL(request.url);
  const boutique_id = searchParams.get('boutique_id');
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '30')));

  if (!produitId || !/^[0-9a-f-]{36}$/.test(produitId)) {
    return NextResponse.json({ error: 'produit_id invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── Auth check ────────────────────────────────────────────────────────────
  if (role.role !== 'admin' && boutique_id) {
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

  // ── Fetch mouvements ──────────────────────────────────────────────────────
  let query = admin
    .from('mouvements_stock')
    .select('*')
    .eq('produit_id', produitId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (boutique_id) query = query.eq('boutique_id', boutique_id);

  const { data: mouvements, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Enrich with user initiales ────────────────────────────────────────────
  const userIds = [
    ...new Set((mouvements ?? []).map((m) => m.created_by).filter(Boolean) as string[]),
  ];

  const profilesMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nom_complet')
      .in('id', userIds);

    if (profiles) {
      for (const p of profiles) {
        const parts = (p.nom_complet ?? '').split(' ').filter(Boolean);
        profilesMap[p.id] = parts.length >= 2
          ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
          : (p.nom_complet ?? '').slice(0, 2).toUpperCase();
      }
    }
  }

  const enriched = (mouvements ?? []).map((m) => ({
    ...m,
    user_initiales: m.created_by ? (profilesMap[m.created_by] ?? null) : null,
  }));

  return NextResponse.json({ mouvements: enriched });
}
