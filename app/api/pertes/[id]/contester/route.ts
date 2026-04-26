import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/pertes/[id]/contester
 * Body: { raison: string }
 * Owner contests a perte declaration (declaree → contestee)
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { raison } = body as Record<string, unknown>;
  if (!raison || typeof raison !== 'string' || raison.trim().length < 5) {
    return NextResponse.json({ error: 'Une raison de contestation est requise (min 5 caractères)' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: perte, error: fetchError } = await admin
    .from('pertes_declarations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!perte) return NextResponse.json({ error: 'Perte introuvable' }, { status: 404 });

  // Only owner can contest
  const { data: ownedBoutique } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', perte.boutique_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!ownedBoutique) {
    return NextResponse.json({ error: 'Seul le propriétaire peut contester' }, { status: 403 });
  }

  if (perte.statut !== 'declaree') {
    return NextResponse.json(
      { error: `Impossible de contester une perte en statut "${perte.statut}"` },
      { status: 422 },
    );
  }

  const noteWithRaison = perte.note
    ? `${perte.note}\n\n[Contestée] ${raison.trim()}`
    : `[Contestée] ${raison.trim()}`;

  const { data: updated, error } = await admin
    .from('pertes_declarations')
    .update({
      statut: 'contestee',
      note: noteWithRaison,
      valide_by: user.id,
      valide_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: updated });
}
