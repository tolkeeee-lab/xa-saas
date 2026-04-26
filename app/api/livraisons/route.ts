import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import type { Livraison } from '@/types/database';

const PAGE_SIZE = 20;

type LivraisonStatut = Livraison['statut'];
const VALID_STATUTS: readonly LivraisonStatut[] = [
  'preparation',
  'en_route',
  'livree',
  'retournee',
] as const;

/**
 * GET /api/livraisons?boutique_id=X&statut=en_route&search=q&page=1
 * Returns paginated list of livraisons for the authenticated user's boutiques.
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
  const boutiqueIdParam = searchParams.get('boutique_id');
  const search = searchParams.get('search')?.trim() ?? '';
  const tab = searchParams.get('tab') ?? '';

  const statutRaw = searchParams.get('statut');
  const statut: LivraisonStatut | null =
    statutRaw && (VALID_STATUTS as readonly string[]).includes(statutRaw)
      ? (statutRaw as LivraisonStatut)
      : null;

  const admin = createAdminClient();

  // Get all boutique IDs accessible by this user
  const [{ data: ownedBoutiques }, { data: assignedBoutiques }] = await Promise.all([
    admin.from('boutiques').select('id').eq('proprietaire_id', user.id),
    admin.from('employes').select('boutique_id').eq('proprietaire_id', user.id).eq('actif', true),
  ]);

  const ownedIds = (ownedBoutiques ?? []).map((b: { id: string }) => b.id);
  const assignedIds = (assignedBoutiques ?? []).map(
    (e: { boutique_id: string }) => e.boutique_id,
  );
  const accessibleIds = [...new Set([...ownedIds, ...assignedIds])];

  if (!accessibleIds.length) {
    return NextResponse.json({ data: [], total: 0, page });
  }

  const filteredBoutiqueIds =
    boutiqueIdParam && accessibleIds.includes(boutiqueIdParam)
      ? [boutiqueIdParam]
      : accessibleIds;

  // Get commandes_b2b IDs for accessible boutiques to join livraisons
  const { data: commandesData } = await admin
    .from('commandes_b2b')
    .select('id')
    .in('boutique_id', filteredBoutiqueIds);

  const commandeIds = (commandesData ?? []).map((c: { id: string }) => c.id);

  if (!commandeIds.length) {
    return NextResponse.json({ data: [], total: 0, page });
  }

  let query = admin
    .from('livraisons')
    .select('*')
    .in('commande_b2b_id', commandeIds)
    .order('parti_at', { ascending: false, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  // Tab filtering
  if (tab === 'en_cours') {
    query = query.in('statut', ['preparation', 'en_route']);
  } else if (tab === 'livrees') {
    query = query.eq('statut', 'livree').order('livre_at', { ascending: false });
  } else if (tab === 'retournees') {
    query = query.eq('statut', 'retournee');
  } else if (statut) {
    query = query.eq('statut', statut);
  }

  if (search) {
    query = query.ilike('numero', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count total for pagination
  let countQuery = admin
    .from('livraisons')
    .select('*', { count: 'exact', head: true })
    .in('commande_b2b_id', commandeIds);

  if (tab === 'en_cours') {
    countQuery = countQuery.in('statut', ['preparation', 'en_route']);
  } else if (tab === 'livrees') {
    countQuery = countQuery.eq('statut', 'livree');
  } else if (tab === 'retournees') {
    countQuery = countQuery.eq('statut', 'retournee');
  } else if (statut) {
    countQuery = countQuery.eq('statut', statut);
  }

  if (search) {
    countQuery = countQuery.ilike('numero', `%${search}%`);
  }

  const { count } = await countQuery;

  return NextResponse.json({
    data: (data ?? []) as Livraison[],
    total: count ?? 0,
    page,
  });
}
