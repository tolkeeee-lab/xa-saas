import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { validateRetraitCodeSchema } from '@/lib/schemas/retraits';

/**
 * POST /api/retraits/validate
 * Body: { code: string, boutique_id: string }
 * Calls RPC validate_retrait_code and returns the retrait if valid.
 */
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

  const { data: body, error: validationError } = validateBody(
    validateRetraitCodeSchema,
    rawBody,
  );
  if (validationError) return validationError;

  const { code, boutique_id } = body;

  const admin = createAdminClient();

  // Check access to boutique
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

  const { data, error } = await admin.rpc('validate_retrait_code', {
    p_code: code,
    p_boutique_id: boutique_id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  const retraits = data as unknown[];
  if (!retraits || retraits.length === 0) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 422 });
  }

  return NextResponse.json({ retrait: retraits[0] });
}
