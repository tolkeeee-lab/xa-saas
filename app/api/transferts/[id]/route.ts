import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { transfertsPatchSchema } from '@/lib/schemas/transferts';
import { revalidateUserCache } from '@/lib/revalidate';

/**
 * PATCH /api/transferts/[id]
 * Updates the status of a transfer (e.g. mark as delivered).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request);
  if (limited) return limited;

  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'id transfert requis' }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(transfertsPatchSchema, rawBody);
  if (validationError) return validationError;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('transferts')
    .update({ statut: body.statut })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['transferts', 'notifications', 'alertes-stock']);

  return NextResponse.json(data);
}
