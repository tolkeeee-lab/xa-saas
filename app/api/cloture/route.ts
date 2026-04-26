import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import type { ClotureCaisseJour } from '@/types/database';

const PAGE_SIZE = 30;

type ClotureStatut = ClotureCaisseJour['statut'];
const VALID_STATUTS: readonly ClotureStatut[] = [
  'a_valider',
  'equilibree',
  'manque',
  'excedent',
] as const;

/**
 * GET /api/cloture?boutique_id=X&page=1&mois=2026-04&statut=manque
 * Returns paginated history of clotures
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
  const boutique_id = searchParams.get('boutique_id');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const mois = searchParams.get('mois'); // YYYY-MM
  const statutRaw = searchParams.get('statut');
  const statut: ClotureStatut | null =
    statutRaw && (VALID_STATUTS as readonly string[]).includes(statutRaw)
      ? (statutRaw as ClotureStatut)
      : null;

  if (!boutique_id) {
    return NextResponse.json({ error: 'boutique_id requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check access
  const [{ data: ownedBoutique }, { data: assignedEmploye }] = await Promise.all([
    admin
      .from('boutiques')
      .select('id')
      .eq('id', boutique_id)
      .eq('proprietaire_id', user.id)
      .maybeSingle(),
    admin
      .from('employes')
      .select('id')
      .eq('boutique_id', boutique_id)
      .eq('proprietaire_id', user.id)
      .eq('actif', true)
      .maybeSingle(),
  ]);

  if (!ownedBoutique && !assignedEmploye) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  let query = admin
    .from('cloture_caisse_jour')
    .select('*')
    .eq('boutique_id', boutique_id)
    .order('date_cloture', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (mois) {
    // Filter by month YYYY-MM → date_cloture between YYYY-MM-01 and YYYY-MM-31
    query = query.gte('date_cloture', `${mois}-01`).lte('date_cloture', `${mois}-31`);
  }

  if (statut) {
    query = query.eq('statut', statut);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: (data ?? []) as ClotureCaisseJour[], page });
} 
