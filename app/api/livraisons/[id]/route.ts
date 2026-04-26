import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import type { Livraison, CommandeB2B } from '@/types/database';

type RouteParams = { params: Promise<{ id: string }> };

type LivraisonDetail = Livraison & {
  commande_b2b: CommandeB2B | null;
};

/**
 * GET /api/livraisons/[id]
 * Returns full livraison details with joined commande_b2b.
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

  // Get the livraison
  const { data: livraison, error } = await admin
    .from('livraisons')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !livraison) {
    return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });
  }

  // Verify access: check that the related commande_b2b belongs to a boutique owned/assigned by this user
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

  // Fetch commande_b2b details
  let commandeB2B: CommandeB2B | null = null;
  if (livraison.commande_b2b_id) {
    const { data: cmd } = await admin
      .from('commandes_b2b')
      .select('*')
      .eq('id', livraison.commande_b2b_id)
      .single();
    commandeB2B = (cmd as CommandeB2B) ?? null;
  }

  const result: LivraisonDetail = {
    ...(livraison as Livraison),
    commande_b2b: commandeB2B,
  };

  return NextResponse.json(result);
}
