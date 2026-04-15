import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { dettesPatchSchema } from '@/lib/schemas/dettes';

type DetteStatut = 'en_attente' | 'paye' | 'en_retard';

type DetteUpdatePayload = {
  statut?: DetteStatut;
  montant_rembourse?: number;
};

/**
 * PATCH /api/dettes/[id] → mettre à jour statut / montant_rembourse
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request);
  if (limited) return limited;

  const { error: authError } = await getAuthUser();
  if (authError) return authError;

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(dettesPatchSchema, rawBody);
  if (validationError) return validationError;

  const admin = createAdminClient();

  const payload: DetteUpdatePayload = {};
  if (body.statut !== undefined) payload.statut = body.statut;
  if (body.montant_rembourse !== undefined) payload.montant_rembourse = body.montant_rembourse;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('dettes')
    .update(payload)
    .eq('id', id)
    .select(
      'id, boutique_id, client_nom, client_telephone, montant, montant_rembourse, description, statut, date_echeance, created_at',
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}