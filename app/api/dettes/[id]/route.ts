import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

type DetteStatut = 'en_attente' | 'paye' | 'en_retard';

/**
 * PATCH /api/dettes/[id] → mettre à jour statut / montant_rembourse
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { statut?: DetteStatut; montant_rembourse?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  const validStatuts: DetteStatut[] = ['en_attente', 'paye', 'en_retard'];
  const statut =
    body.statut && validStatuts.includes(body.statut) ? body.statut : undefined;
  const montant_rembourse =
    typeof body.montant_rembourse === 'number'
      ? body.montant_rembourse
      : undefined;

  if (statut === undefined && montant_rembourse === undefined) {
    return NextResponse.json(
      { error: 'Aucun champ à mettre à jour' },
      { status: 400 },
    );
  }

  const { data, error } = await admin
    .from('dettes')
    .update({
      ...(statut !== undefined ? { statut } : {}),
      ...(montant_rembourse !== undefined ? { montant_rembourse } : {}),
    })
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