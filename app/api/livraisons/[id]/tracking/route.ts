import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/livraisons/[id]/tracking
 * Lightweight endpoint for 30-second position polling.
 * Returns only: position_actuelle_lat, position_actuelle_lng, last_ping, statut
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
  const admin = createAdminClient();

  const { data: livraison, error } = await admin
    .from('livraisons')
    .select('id, statut, position_actuelle_lat, position_actuelle_lng, last_ping, commande_b2b_id')
    .eq('id', id)
    .single();

  if (error || !livraison) {
    return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });
  }

  // Verify access
  if (livraison.commande_b2b_id) {
    const { data: commande } = await admin
      .from('commandes_b2b')
      .select('boutique_id')
      .eq('id', livraison.commande_b2b_id)
      .single();

    if (commande) {
      const [{ data: owned }, { data: assigned }] = await Promise.all([
        admin
          .from('boutiques')
          .select('id')
          .eq('id', commande.boutique_id)
          .eq('proprietaire_id', user.id)
          .maybeSingle(),
        admin
          .from('employes')
          .select('id')
          .eq('boutique_id', commande.boutique_id)
          .eq('proprietaire_id', user.id)
          .eq('actif', true)
          .maybeSingle(),
      ]);

      if (!owned && !assigned) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    }
  }

  return NextResponse.json(
    {
      statut: livraison.statut,
      position_actuelle_lat: livraison.position_actuelle_lat,
      position_actuelle_lng: livraison.position_actuelle_lng,
      last_ping: livraison.last_ping,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
