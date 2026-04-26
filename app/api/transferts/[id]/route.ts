import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import type { TransfertStock } from '@/types/database';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/transferts/[id]
 * Returns detailed info for a specific transfert_stock.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

  const { data: transfert, error } = await admin
    .from('transferts_stock')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!transfert) return NextResponse.json({ error: 'Transfert introuvable' }, { status: 404 });

  // Check access: user must own or be assigned to source or destination
  const [{ data: ownedSource }, { data: ownedDest }, { data: assignedSource }, { data: assignedDest }] =
    await Promise.all([
      admin
        .from('boutiques')
        .select('id')
        .eq('id', transfert.boutique_source_id)
        .eq('proprietaire_id', user.id)
        .maybeSingle(),
      admin
        .from('boutiques')
        .select('id')
        .eq('id', transfert.boutique_destination_id)
        .eq('proprietaire_id', user.id)
        .maybeSingle(),
      admin
        .from('employes')
        .select('id')
        .eq('boutique_id', transfert.boutique_source_id)
        .eq('proprietaire_id', user.id)
        .eq('actif', true)
        .maybeSingle(),
      admin
        .from('employes')
        .select('id')
        .eq('boutique_id', transfert.boutique_destination_id)
        .eq('proprietaire_id', user.id)
        .eq('actif', true)
        .maybeSingle(),
    ]);

  if (!ownedSource && !ownedDest && !assignedSource && !assignedDest) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Enrich with boutique names and produit name
  const [{ data: sourceBoutique }, { data: destBoutique }, { data: produit }] = await Promise.all([
    admin.from('boutiques').select('id, nom, couleur_theme').eq('id', transfert.boutique_source_id).maybeSingle(),
    admin.from('boutiques').select('id, nom, couleur_theme').eq('id', transfert.boutique_destination_id).maybeSingle(),
    admin.from('produits').select('id, nom, unite, categorie').eq('id', transfert.produit_id).maybeSingle(),
  ]);

  const canReceive = !!(ownedDest || assignedDest);
  const canCancel = !!(ownedSource);

  return NextResponse.json({
    data: transfert as TransfertStock,
    boutique_source: sourceBoutique,
    boutique_destination: destBoutique,
    produit,
    canReceive,
    canCancel,
  });
}
