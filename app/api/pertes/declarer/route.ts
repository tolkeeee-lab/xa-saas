import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import type { PerteDeclaration } from '@/types/database';

type PerteMotif = PerteDeclaration['motif'];

const VALID_MOTIFS: readonly PerteMotif[] = [
  'sac_perce',
  'perime',
  'vol',
  'erreur_saisie',
  'autre',
] as const;

/**
 * POST /api/pertes/declarer
 * Body: { boutique_id, produit_id, motif, quantite, note?, photo_url? }
 * Wraps RPC declare_perte + saves photo_url if provided
 */
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { boutique_id, produit_id, motif, quantite, note, photo_url } = body as Record<
    string,
    unknown
  >;

  if (!boutique_id || typeof boutique_id !== 'string') {
    return NextResponse.json({ error: 'boutique_id requis' }, { status: 400 });
  }
  if (!produit_id || typeof produit_id !== 'string') {
    return NextResponse.json({ error: 'produit_id requis' }, { status: 400 });
  }
  if (!motif || !(VALID_MOTIFS as readonly string[]).includes(motif as string)) {
    return NextResponse.json(
      { error: `motif invalide. Valeurs acceptées: ${VALID_MOTIFS.join(', ')}` },
      { status: 400 },
    );
  }
  if (!quantite || typeof quantite !== 'number' || quantite <= 0 || !Number.isInteger(quantite)) {
    return NextResponse.json({ error: 'quantite doit être un entier positif' }, { status: 400 });
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

  // Call RPC
  const { data: perte, error } = await admin.rpc('declare_perte', {
    p_boutique_id: boutique_id,
    p_produit_id: produit_id,
    p_motif: motif as string,
    p_quantite: quantite as number,
    p_note: note && typeof note === 'string' ? note : null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If photo_url provided, update record
  if (photo_url && typeof photo_url === 'string' && perte) {
    const perteRecord = perte as PerteDeclaration;
    await admin
      .from('pertes_declarations')
      .update({ photo_url: photo_url })
      .eq('id', perteRecord.id);
  }

  return NextResponse.json({ data: perte as PerteDeclaration }, { status: 201 });
}
