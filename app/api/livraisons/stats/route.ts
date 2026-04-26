import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/livraisons/stats?boutique_id=X
 * Returns counts per tab for the livraisons module.
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
  const boutiqueIdParam = searchParams.get('boutique_id');

  const admin = createAdminClient();

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
    return NextResponse.json({ en_cours: 0, livrees: 0, retournees: 0 });
  }

  const filteredBoutiqueIds =
    boutiqueIdParam && accessibleIds.includes(boutiqueIdParam)
      ? [boutiqueIdParam]
      : accessibleIds;

  const { data: commandesData } = await admin
    .from('commandes_b2b')
    .select('id')
    .in('boutique_id', filteredBoutiqueIds);

  const commandeIds = (commandesData ?? []).map((c: { id: string }) => c.id);

  if (!commandeIds.length) {
    return NextResponse.json({ en_cours: 0, livrees: 0, retournees: 0 });
  }

  const [enCoursRes, livreesRes, retourneesRes] = await Promise.all([
    admin
      .from('livraisons')
      .select('id', { count: 'exact', head: true })
      .in('commande_b2b_id', commandeIds)
      .in('statut', ['preparation', 'en_route']),
    admin
      .from('livraisons')
      .select('id', { count: 'exact', head: true })
      .in('commande_b2b_id', commandeIds)
      .eq('statut', 'livree'),
    admin
      .from('livraisons')
      .select('id', { count: 'exact', head: true })
      .in('commande_b2b_id', commandeIds)
      .eq('statut', 'retournee'),
  ]);

  return NextResponse.json({
    en_cours: enCoursRes.count ?? 0,
    livrees: livreesRes.count ?? 0,
    retournees: retourneesRes.count ?? 0,
  });
}
