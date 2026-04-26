import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/pertes/stats?boutique_id=X
 * Returns global stats: total lost FCFA, top motifs, by boutique
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

  const { data, error } = await admin
    .from('pertes_declarations')
    .select('motif, valeur_estimee, statut')
    .eq('boutique_id', boutique_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pertes = data ?? [];
  const total_valeur = pertes.reduce((sum, p) => sum + (p.valeur_estimee ?? 0), 0);
  const total_valeur_validee = pertes
    .filter((p) => p.statut === 'validee' || p.statut === 'comptabilisee')
    .reduce((sum, p) => sum + (p.valeur_estimee ?? 0), 0);

  // Top motifs
  const motifCounts: Record<string, number> = {};
  for (const p of pertes) {
    motifCounts[p.motif] = (motifCounts[p.motif] ?? 0) + 1;
  }
  const top_motifs = Object.entries(motifCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([motif, count]) => ({ motif, count }));

  return NextResponse.json({
    total_declarations: pertes.length,
    total_valeur,
    total_valeur_validee,
    top_motifs,
  });
}
