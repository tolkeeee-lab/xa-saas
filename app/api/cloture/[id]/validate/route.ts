import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/cloture/[id]/validate
 * Owner-only: validates a clôture (sets valide_par, valide_at, updates statut)
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

  // Fetch cloture
  const { data: cloture, error: fetchError } = await admin
    .from('cloture_caisse_jour')
    .select('id, boutique_id, statut')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!cloture) return NextResponse.json({ error: 'Clôture introuvable' }, { status: 404 });

  // Check ownership (only owner can validate)
  const { data: ownedBoutique } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', cloture.boutique_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!ownedBoutique) {
    return NextResponse.json({ error: 'Accès refusé — réservé au propriétaire' }, { status: 403 });
  }

  if (cloture.statut !== 'a_valider') {
    return NextResponse.json(
      { error: 'Cette clôture ne peut pas être validée (statut incompatible)' },
      { status: 400 },
    );
  }

  const { data: updated, error: updateError } = await admin
    .from('cloture_caisse_jour')
    .update({
      valide_par: user.id,
      valide_at: new Date().toISOString(),
      statut: 'equilibree',
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, cloture: updated });
}
