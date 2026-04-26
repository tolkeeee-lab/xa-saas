import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import { revalidateUserCache } from '@/lib/revalidate';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/transferts/[id]/annuler
 * Cancels a pending transfert_stock. Proprio source only.
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
    .select('id, statut, boutique_source_id, produit_id, quantite')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!transfert) return NextResponse.json({ error: 'Transfert introuvable' }, { status: 404 });
  if (transfert.statut !== 'en_attente') {
    return NextResponse.json({ error: 'Seuls les transferts en attente peuvent être annulés' }, { status: 409 });
  }

  // Only source boutique owner can cancel
  const { data: ownedSource } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', transfert.boutique_source_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!ownedSource) {
    return NextResponse.json({ error: 'Seul le propriétaire de la boutique source peut annuler' }, { status: 403 });
  }

  // Mark as annulé
  const { data: updated, error: updateError } = await admin
    .from('transferts_stock')
    .update({ statut: 'annule' })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Restore stock to source boutique
  const { data: produit } = await admin
    .from('produits')
    .select('id, stock_actuel')
    .eq('id', transfert.produit_id)
    .eq('boutique_id', transfert.boutique_source_id)
    .maybeSingle();

  if (produit) {
    await admin
      .from('produits')
      .update({ stock_actuel: produit.stock_actuel + transfert.quantite })
      .eq('id', transfert.produit_id)
      .eq('boutique_id', transfert.boutique_source_id);
  }

  revalidateUserCache(user.id, ['transferts', 'notifications', 'alertes-stock', 'stocks-consolides']);

  return NextResponse.json({ data: updated });
}
