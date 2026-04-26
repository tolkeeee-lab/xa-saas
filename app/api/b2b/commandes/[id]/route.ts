import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: commande, error: commandeError } = await admin
    .from('commandes_b2b')
    .select('*')
    .eq('id', id)
    .single();

  if (commandeError || !commande) {
    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
  }

  const { data: boutique, error: boutiqueError } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', commande.boutique_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (boutiqueError || !boutique) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const [{ data: lignes, error: lignesError }, { data: livraison, error: livraisonsError }] =
    await Promise.all([
      admin.from('commandes_b2b_lignes').select('*').eq('commande_id', id),
      admin.from('livraisons').select('*').eq('commande_b2b_id', id).maybeSingle(),
    ]);

  if (lignesError) return NextResponse.json({ error: lignesError.message }, { status: 500 });
  if (livraisonsError) return NextResponse.json({ error: livraisonsError.message }, { status: 500 });

  return NextResponse.json({
    commande,
    lignes: lignes ?? [],
    livraison: livraison ?? null,
  });
}
