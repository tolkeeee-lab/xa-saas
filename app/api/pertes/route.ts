import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import type { PerteDeclaration } from '@/types/database';

/**
 * GET /api/pertes?boutique_id=X&page=1&statut=declaree&motif=vol&mois=2026-04&q=search
 * Returns paginated list of pertes declarations
 */

const PAGE_SIZE = 30;

type PerteMotif = PerteDeclaration['motif'];
type PerteStatut = PerteDeclaration['statut'];

const VALID_MOTIFS: readonly PerteMotif[] = [
  'sac_perce',
  'perime',
  'vol',
  'erreur_saisie',
  'autre',
] as const;

const VALID_STATUTS: readonly PerteStatut[] = [
  'declaree',
  'validee',
  'contestee',
  'comptabilisee',
] as const;

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
  const mois = searchParams.get('mois');
  const q = searchParams.get('q')?.trim() ?? '';

  const statutRaw = searchParams.get('statut');
  const statut: PerteStatut | null =
    statutRaw && (VALID_STATUTS as readonly string[]).includes(statutRaw)
      ? (statutRaw as PerteStatut)
      : null;

  const motifRaw = searchParams.get('motif');
  const motif: PerteMotif | null =
    motifRaw && (VALID_MOTIFS as readonly string[]).includes(motifRaw)
      ? (motifRaw as PerteMotif)
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
    .from('pertes_declarations')
    .select('*')
    .eq('boutique_id', boutique_id)
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (statut) {
    query = query.eq('statut', statut);
  } else if (searchParams.get('tab') === 'validees') {
    query = query.in('statut', ['validee', 'comptabilisee']);
  }

  if (motif) {
    query = query.eq('motif', motif);
  }

  if (mois) {
    query = query
      .gte('created_at', `${mois}-01T00:00:00.000Z`)
      .lte('created_at', `${mois}-31T23:59:59.999Z`);
  }

  if (q) {
    query = query.ilike('produit_nom', `%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Counts per tab
  const [allCount, declareeCount, valideeCount, contesteeCount] = await Promise.all([
    admin
      .from('pertes_declarations')
      .select('id', { count: 'exact', head: true })
      .eq('boutique_id', boutique_id),
    admin
      .from('pertes_declarations')
      .select('id', { count: 'exact', head: true })
      .eq('boutique_id', boutique_id)
      .eq('statut', 'declaree'),
    admin
      .from('pertes_declarations')
      .select('id', { count: 'exact', head: true })
      .eq('boutique_id', boutique_id)
      .in('statut', ['validee', 'comptabilisee']),
    admin
      .from('pertes_declarations')
      .select('id', { count: 'exact', head: true })
      .eq('boutique_id', boutique_id)
      .eq('statut', 'contestee'),
  ]);

  return NextResponse.json({
    data: (data ?? []) as PerteDeclaration[],
    page,
    counts: {
      toutes: allCount.count ?? 0,
      a_valider: declareeCount.count ?? 0,
      validees: valideeCount.count ?? 0,
      contestees: contesteeCount.count ?? 0,
    },
  });
}
