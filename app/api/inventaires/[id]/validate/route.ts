import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { revalidateUserCache } from '@/lib/revalidate';

/**
 * POST /api/inventaires/[id]/validate — valider un inventaire via RPC atomique
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const { id } = await params;

  const admin = createAdminClient();

  // Vérifier ownership avant d'appeler le RPC
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
    return NextResponse.json({ error: 'L\'inventaire n\'est pas en cours' }, { status: 400 });
  }

  // Appeler le RPC validate_inventaire (atomique)
  const { data, error } = await admin.rpc('validate_inventaire', { inv_id: id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['inventaires', 'produits']);

  return NextResponse.json(Array.isArray(data) ? data[0] : data);
}
