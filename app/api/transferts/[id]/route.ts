import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

type PatchBody = {
  statut?: 'en_transit' | 'livre';
};

/**
 * PATCH /api/transferts/[id]
 * Updates the status of a transfer (e.g. mark as delivered).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'id transfert requis' }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (!body.statut || !['en_transit', 'livre'].includes(body.statut)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 422 });
  }

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

  return NextResponse.json(data);
}
