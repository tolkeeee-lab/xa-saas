import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { markRetiredSchema } from '@/lib/schemas/retraits';

/**
 * POST /api/retraits/[id]/mark-retired
 * Body: { employe_id: string }
 * Calls RPC mark_retrait_retired.
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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(markRetiredSchema, rawBody);
  if (validationError) return validationError;

  const { employe_id } = body;

  const admin = createAdminClient();

  // Fetch retrait to check access
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
      { error: 'Ce retrait ne peut plus être validé (statut: ' + retrait.statut + ')' },
      { status: 409 },
    );
  }

  // Check access
  const [{ data: ownedBoutique }, { data: assignedEmploye }] = await Promise.all([
    admin
      .from('boutiques')
      .select('id')
      .eq('id', retrait.boutique_id)
      .eq('proprietaire_id', user.id)
      .maybeSingle(),
    admin
      .from('employes')
      .select('id')
      .eq('boutique_id', retrait.boutique_id)
      .eq('proprietaire_id', user.id)
      .eq('actif', true)
      .maybeSingle(),
  ]);

  if (!ownedBoutique && !assignedEmploye) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { data, error } = await admin.rpc('mark_retrait_retired', {
    p_retrait_id: id,
    p_employe_id: employe_id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, retrait: data });
}
