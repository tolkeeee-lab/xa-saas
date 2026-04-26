import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/transferts/stats
 * Returns tab counts for the authenticated user's transferts_stock.
 */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = createAdminClient();

  // Get accessible boutique IDs
  const [{ data: ownedBoutiques }, { data: assignedBoutiques }] = await Promise.all([
    admin.from('boutiques').select('id').eq('proprietaire_id', user.id),
    admin
      .from('employes')
      .select('boutique_id')
      .eq('proprietaire_id', user.id)
      .eq('actif', true),
  ]);

  const ownedIds = (ownedBoutiques ?? []).map((b: { id: string }) => b.id);
  const assignedIds = (assignedBoutiques ?? []).map((e: { boutique_id: string }) => e.boutique_id);
  const accessibleIds = [...new Set([...ownedIds, ...assignedIds])];

  if (!accessibleIds.length) {
    return NextResponse.json({ a_recevoir: 0, envoyes: 0, recus: 0, annules: 0 });
  }

  const baseFilter = `boutique_source_id.in.(${accessibleIds.join(',')}),boutique_destination_id.in.(${accessibleIds.join(',')})`;

  const [aRecevoirCount, envoyesCount, recusCount, annulesCount] = await Promise.all([
    admin
      .from('transferts_stock')
      .select('id', { count: 'exact', head: true })
      .or(baseFilter)
      .eq('statut', 'en_attente')
      .in('boutique_destination_id', accessibleIds),
    admin
      .from('transferts_stock')
      .select('id', { count: 'exact', head: true })
      .or(baseFilter)
      .eq('statut', 'en_attente')
      .in('boutique_source_id', ownedIds.length ? ownedIds : accessibleIds),
    admin
      .from('transferts_stock')
      .select('id', { count: 'exact', head: true })
      .or(baseFilter)
      .eq('statut', 'recu'),
    admin
      .from('transferts_stock')
      .select('id', { count: 'exact', head: true })
      .or(baseFilter)
      .eq('statut', 'annule'),
  ]);

  return NextResponse.json({
    a_recevoir: aRecevoirCount.count ?? 0,
    envoyes: envoyesCount.count ?? 0,
    recus: recusCount.count ?? 0,
    annules: annulesCount.count ?? 0,
  });
}
