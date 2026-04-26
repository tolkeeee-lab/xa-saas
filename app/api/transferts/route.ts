import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import type { TransfertStock } from '@/types/database';

const PAGE_SIZE = 30;

type TransfertStatut = TransfertStock['statut'];
const VALID_STATUTS: readonly TransfertStatut[] = ['en_attente', 'recu', 'annule'] as const;

/**
 * GET /api/transferts?source_id=X&dest_id=Y&statut=en_attente&page=1
 * Returns paginated list of transferts_stock for the authenticated user.
 */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const sourceId = searchParams.get('source_id');
  const destId = searchParams.get('dest_id');
  const tab = searchParams.get('tab') ?? '';

  const statutRaw = searchParams.get('statut');
  const statut: TransfertStatut | null =
    statutRaw && (VALID_STATUTS as readonly string[]).includes(statutRaw)
      ? (statutRaw as TransfertStatut)
      : null;

  const admin = createAdminClient();

  // Get all boutique IDs accessible by this user (owned or assigned)
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
    return NextResponse.json({
      data: [],
      page,
      counts: { a_recevoir: 0, envoyes: 0, recus: 0, annules: 0 },
    });
  }

  // Build base query
  let query = admin
    .from('transferts_stock')
    .select('*')
    .or(
      `boutique_source_id.in.(${accessibleIds.join(',')}),boutique_destination_id.in.(${accessibleIds.join(',')})`,
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  // Tab filtering
  if (tab === 'a_recevoir') {
    query = query
      .eq('statut', 'en_attente')
      .in('boutique_destination_id', accessibleIds);
  } else if (tab === 'envoyes') {
    query = query
      .eq('statut', 'en_attente')
      .in('boutique_source_id', ownedIds.length ? ownedIds : accessibleIds);
  } else if (tab === 'recus') {
    query = query.eq('statut', 'recu');
  } else if (tab === 'annules') {
    query = query.eq('statut', 'annule');
  } else if (statut) {
    query = query.eq('statut', statut);
  }

  if (sourceId) {
    query = query.eq('boutique_source_id', sourceId);
  }
  if (destId) {
    query = query.eq('boutique_destination_id', destId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Counts per tab
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
    data: (data ?? []) as TransfertStock[],
    page,
    counts: {
      a_recevoir: aRecevoirCount.count ?? 0,
      envoyes: envoyesCount.count ?? 0,
      recus: recusCount.count ?? 0,
      annules: annulesCount.count ?? 0,
    },
  });
}
 
