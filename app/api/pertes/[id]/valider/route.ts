import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/pertes/[id]/valider
 * Owner validates a perte declaration (declaree → validee)
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

  const { data: perte, error: fetchError } = await admin
    .from('pertes_declarations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!perte) return NextResponse.json({ error: 'Perte introuvable' }, { status: 404 });

  // Only owner can validate
  const { data: ownedBoutique } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', perte.boutique_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!ownedBoutique) {
    return NextResponse.json({ error: 'Seul le propriétaire peut valider' }, { status: 403 });
  }

  if (perte.statut !== 'declaree') {
    return NextResponse.json(
      { error: `Impossible de valider une perte en statut "${perte.statut}"` },
      { status: 422 },
    );
  }

  const { data: updated, error } = await admin
    .from('pertes_declarations')
    .update({ statut: 'validee', valide_by: user.id, valide_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: updated });
}
