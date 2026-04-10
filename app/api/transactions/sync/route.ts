/**
 * POST /api/transactions/sync
 *
 * Endpoint de synchronisation pour le Background Sync du Service Worker.
 * Reçoit une transaction stockée hors ligne et l'insère dans Supabase.
 *
 * Body JSON : TransactionInsert (avec local_id)
 * Réponse   : { synced: true, id: string } | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase-admin';
import type { TransactionInsert } from '../../../../types/database';

export async function POST(request: NextRequest) {
  let body: Partial<TransactionInsert>;
  try {
    body = await request.json() as Partial<TransactionInsert>;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { boutique_id, type, mode_paiement, montant_total, local_id } = body;

  if (!boutique_id || !type || !mode_paiement || montant_total === undefined) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotence : si local_id déjà présent, retourner succès
  if (local_id) {
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('local_id', local_id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ synced: true, id: existing.id });
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      boutique_id,
      employe_id: body.employe_id ?? null,
      client_debiteur_id: body.client_debiteur_id ?? null,
      type,
      mode_paiement,
      montant_total,
      montant_recu: body.montant_recu ?? 0,
      monnaie_rendue: body.monnaie_rendue ?? 0,
      montant_credit: body.montant_credit ?? 0,
      statut: 'validee',
      sync_statut: 'synced',
      synced_at: new Date().toISOString(),
      local_id: local_id ?? crypto.randomUUID(),
      created_at: body.created_at ?? new Date().toISOString(),
      reference: body.reference ?? null,
      notes: body.notes ?? null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ synced: true, id: data.id });
}
