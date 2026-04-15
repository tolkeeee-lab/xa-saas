import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';

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
  const { error: authError } = await getAuthUser();
  if (authError) return authError;

  const { id } = await params;

  let body: { statut?: unknown; montant_rembourse?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  const validStatuts: DetteStatut[] = ['en_attente', 'paye', 'en_retard'];
  const payload: DetteUpdatePayload = {};

  if (typeof body.statut === 'string' && validStatuts.includes(body.statut as DetteStatut)) {
    payload.statut = body.statut as DetteStatut;
  }
  if (typeof body.montant_rembourse === 'number') {
    payload.montant_rembourse = body.montant_rembourse;
  }

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