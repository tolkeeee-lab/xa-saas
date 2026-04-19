import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { inventairePatchSchema } from '@/lib/schemas/inventaires';
import { revalidateUserCache } from '@/lib/revalidate';

/**
 * PATCH /api/inventaires/[id] — annuler un inventaire
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(inventairePatchSchema, rawBody);
  if (validationError) return validationError;

  const admin = createAdminClient();

  // Vérifier ownership
  const { data: existing } = await admin
    .from('inventaires')
    .select('id, statut, proprietaire_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Inventaire introuvable' }, { status: 404 });
  }

  if ((existing.proprietaire_id as string) !== user.id) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  if ((existing.statut as string) !== 'en_cours') {
    return NextResponse.json({ error: 'Seul un inventaire en cours peut être annulé' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('inventaires')
    .update({ statut: body.statut })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['inventaires']);

  return NextResponse.json(data);
}
