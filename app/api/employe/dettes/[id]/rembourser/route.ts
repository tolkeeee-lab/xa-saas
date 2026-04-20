/**
 * POST /api/employe/dettes/[id]/rembourser
 *
 * Records a partial or full debt repayment for an employee's boutique.
 * Requires xa_employe_session cookie.
 *
 * Body: { montant: number }
 * Response: { success: true, dette: { id, montant_rembourse, statut } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmployeSession } from '@/lib/employe-session-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getEmployeSession();
  if (!session) {
    return NextResponse.json({ error: 'Session employé requise' }, { status: 401 });
  }

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (
    !rawBody ||
    typeof rawBody !== 'object' ||
    typeof (rawBody as Record<string, unknown>).montant !== 'number'
  ) {
    return NextResponse.json({ error: 'montant (number) requis' }, { status: 400 });
  }

  const { montant } = rawBody as { montant: number };

  if (montant <= 0) {
    return NextResponse.json({ error: 'montant doit être positif' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch the debt — verify it belongs to the employee's boutique
  const { data: dette, error: fetchError } = await admin
    .from('dettes')
    .select('id, boutique_id, montant, montant_rembourse, statut')
    .eq('id', id)
    .eq('boutique_id', session.boutique_id)
    .single();

  if (fetchError || !dette) {
    return NextResponse.json({ error: 'Dette introuvable' }, { status: 404 });
  }

  if (dette.statut === 'paye') {
    return NextResponse.json({ error: 'Cette dette est déjà soldée' }, { status: 400 });
  }

  const nouveauRembourse = dette.montant_rembourse + montant;
  const newStatut = nouveauRembourse >= dette.montant ? 'paye' : dette.statut;

  const { data: updated, error: updateError } = await admin
    .from('dettes')
    .update({
      montant_rembourse: Math.min(nouveauRembourse, dette.montant),
      statut: newStatut,
    })
    .eq('id', id)
    .select('id, montant_rembourse, statut')
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }

  return NextResponse.json({ success: true, dette: updated });
}
