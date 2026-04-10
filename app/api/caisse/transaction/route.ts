/**
 * POST /api/caisse/transaction
 *
 * Crée une transaction depuis la caisse (accès public, sans session Supabase).
 * Utilise la clé service-role pour bypasser les RLS.
 *
 * Body JSON : TransactionInsert (sans id, updated_at)
 * Réponse   : { data: Transaction }
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

  const { boutique_id, type, mode_paiement, montant_total, montant_recu, monnaie_rendue } = body;

  if (!boutique_id || !type || !mode_paiement || montant_total === undefined) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      boutique_id,
      employe_id: body.employe_id ?? null,
      client_debiteur_id: body.client_debiteur_id ?? null,
      type,
      mode_paiement,
      montant_total,
      montant_recu: montant_recu ?? 0,
      monnaie_rendue: monnaie_rendue ?? 0,
      montant_credit: body.montant_credit ?? 0,
      statut: 'validee',
      sync_statut: 'synced',
      synced_at: new Date().toISOString(),
      local_id: body.local_id ?? crypto.randomUUID(),
      created_at: body.created_at ?? new Date().toISOString(),
      reference: body.reference ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
