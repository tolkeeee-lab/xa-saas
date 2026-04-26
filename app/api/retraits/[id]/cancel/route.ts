import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * POST /api/retraits/[id]/cancel
 * Owner-only: cancel a retrait en_attente.
 */
export async function POST(
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

  const { data: retrait, error: retraitError } = await admin
    .from('retraits_clients')
    .select('boutique_id, statut')
    .eq('id', id)
    .single();

  if (retraitError || !retrait) {
    return NextResponse.json({ error: 'Retrait introuvable' }, { status: 404 });
  }

  if (retrait.statut !== 'en_attente') {
    return NextResponse.json(
      { error: 'Seuls les retraits en attente peuvent être annulés' },
      { status: 409 },
    );
  }

  // Owner-only check
  const { data: ownedBoutique } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', retrait.boutique_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!ownedBoutique) {
    return NextResponse.json({ error: 'Accès refusé — propriétaire requis' }, { status: 403 });
  }

  const { error: updateError } = await admin
    .from('retraits_clients')
    .update({ statut: 'annule' })
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
