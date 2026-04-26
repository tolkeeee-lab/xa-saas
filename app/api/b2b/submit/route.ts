import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { submitB2BOrderSchema } from '@/lib/schemas/b2b';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(submitB2BOrderSchema, rawBody);
  if (validationError) return validationError;

  const { boutique_id, lignes, mode_paiement, note } = body;

  const admin = createAdminClient();

  const { data: boutique, error: boutiqueError } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', boutique_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (boutiqueError || !boutique) {
    return NextResponse.json(
      { error: 'Boutique introuvable ou accès refusé' },
      { status: 403 },
    );
  }

  const { data, error } = await admin.rpc('submit_b2b_order', {
    p_boutique_id: boutique_id,
    p_lignes: lignes,
    p_note: note ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const commande = data as { id: string } | null;
  if (!commande?.id) {
    return NextResponse.json({ error: 'Commande non créée' }, { status: 500 });
  }

  // Update mode_paiement after creation since the RPC only supports the default 'a_la_livraison'.
  // TODO: update submit_b2b_order RPC to accept p_mode_paiement to avoid this extra call.
  if (mode_paiement !== 'a_la_livraison') {
    const { error: updateError } = await admin
      .from('commandes_b2b')
      .update({ mode_paiement })
      .eq('id', commande.id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, commande_id: commande.id });
}
