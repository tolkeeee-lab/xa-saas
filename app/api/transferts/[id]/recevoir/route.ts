import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import { revalidateUserCache } from '@/lib/revalidate';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/transferts/[id]/recevoir
 * Marks a transfert_stock as received using RPC recevoir_transfert.
 * Requires access to the destination boutique.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch transfert
  const { data: transfert, error: fetchError } = await admin
    .from('transferts_stock')
    .select('id, statut, boutique_destination_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!transfert) return NextResponse.json({ error: 'Transfert introuvable' }, { status: 404 });
  if (transfert.statut !== 'en_attente') {
    return NextResponse.json({ error: 'Ce transfert ne peut plus être reçu' }, { status: 409 });
  }

  // Verify access to destination boutique (owner or assigned employee)
  const [{ data: ownedDest }, { data: assignedDest }] = await Promise.all([
    admin
      .from('boutiques')
      .select('id')
      .eq('id', transfert.boutique_destination_id)
      .eq('proprietaire_id', user.id)
      .maybeSingle(),
    admin
      .from('employes')
      .select('id')
      .eq('boutique_id', transfert.boutique_destination_id)
      .eq('proprietaire_id', user.id)
      .eq('actif', true)
      .maybeSingle(),
  ]);

  if (!ownedDest && !assignedDest) {
    return NextResponse.json({ error: 'Accès refusé à la boutique destination' }, { status: 403 });
  }

  const employeId = assignedDest?.id ?? user.id;

  // Call RPC recevoir_transfert
  const { data: updated, error: rpcError } = await admin.rpc('recevoir_transfert', {
    p_transfert_id: id,
    p_employe_id: employeId,
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['transferts', 'notifications', 'alertes-stock', 'stocks-consolides']);

  return NextResponse.json({ data: updated });
}
