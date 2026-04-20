/**
 * GET /api/employe/cloture?date=YYYY-MM-DD
 *   Returns today's CA, cash théorique, and existing cloture for the employee's boutique.
 *   Requires xa_employe_session cookie.
 *
 * POST /api/employe/cloture
 *   Body: { date, cash_reel, note? }
 *   Upserts the cloture for the employee's boutique.
 *   Requires xa_employe_session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmployeSession } from '@/lib/employe-session-server';
import { createAdminClient } from '@/lib/supabase-admin';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type ParMode = Record<string, number>;

async function computeTheorique(boutiqueId: string, date: string) {
  const admin = createAdminClient();
  const startISO = `${date}T00:00:00.000Z`;
  const endISO = `${date}T23:59:59.999Z`;

  const { data: txs } = await admin
    .from('transactions')
    .select('montant_total, mode_paiement')
    .eq('boutique_id', boutiqueId)
    .eq('statut', 'validee')
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  const rows = txs ?? [];
  const nb_transactions = rows.length;
  const ca_theorique = rows.reduce((s, t) => s + (t.montant_total ?? 0), 0);

  const par_mode: ParMode = {};
  for (const t of rows) {
    const mode = t.mode_paiement ?? 'autre';
    par_mode[mode] = (par_mode[mode] ?? 0) + (t.montant_total ?? 0);
  }

  const cash_theorique = par_mode['especes'] ?? 0;

  return { ca_theorique, cash_theorique, par_mode, nb_transactions };
}

export async function GET(request: NextRequest) {
  const session = await getEmployeSession();
  if (!session) {
    return NextResponse.json({ error: 'Session employé requise' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const date = searchParams.get('date');

  if (!date || !ISO_DATE_RE.test(date)) {
    return NextResponse.json({ error: 'date (YYYY-MM-DD) requis' }, { status: 400 });
  }

  const { ca_theorique, cash_theorique, par_mode, nb_transactions } = await computeTheorique(
    session.boutique_id,
    date,
  );

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('clotures_caisse')
    .select('id, cash_reel, ecart, note')
    .eq('boutique_id', session.boutique_id)
    .eq('date', date)
    .maybeSingle();

  return NextResponse.json({
    ca_theorique,
    cash_theorique,
    par_mode,
    nb_transactions,
    cloture_existante: existing ?? null,
  });
}

export async function POST(request: NextRequest) {
  const session = await getEmployeSession();
  if (!session) {
    return NextResponse.json({ error: 'Session employé requise' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (
    !rawBody ||
    typeof rawBody !== 'object' ||
    typeof (rawBody as Record<string, unknown>).date !== 'string' ||
    typeof (rawBody as Record<string, unknown>).cash_reel !== 'number'
  ) {
    return NextResponse.json({ error: 'date et cash_reel requis' }, { status: 400 });
  }

  const { date, cash_reel, note } = rawBody as {
    date: string;
    cash_reel: number;
    note?: string;
  };

  if (!ISO_DATE_RE.test(date)) {
    return NextResponse.json({ error: 'Format date invalide (YYYY-MM-DD)' }, { status: 400 });
  }

  if (typeof cash_reel !== 'number' || cash_reel < 0) {
    return NextResponse.json({ error: 'cash_reel invalide' }, { status: 400 });
  }

  const { ca_theorique, cash_theorique, par_mode, nb_transactions } = await computeTheorique(
    session.boutique_id,
    date,
  );

  const admin = createAdminClient();

  // Get proprietaire_id from boutique
  const { data: boutique } = await admin
    .from('boutiques')
    .select('proprietaire_id')
    .eq('id', session.boutique_id)
    .single();

  if (!boutique) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });
  }

  const { data: cloture, error } = await admin
    .from('clotures_caisse')
    .upsert(
      {
        boutique_id: session.boutique_id,
        proprietaire_id: boutique.proprietaire_id,
        date,
        ca_theorique,
        cash_theorique,
        cash_reel,
        nb_transactions,
        par_mode,
        note: note ?? null,
      },
      { onConflict: 'boutique_id,date' },
    )
    .select('id, ecart')
    .single();

  if (error || !cloture) {
    return NextResponse.json({ error: error?.message ?? 'Erreur lors de la clôture' }, { status: 500 });
  }

  return NextResponse.json({ success: true, cloture: { id: cloture.id, ecart: cloture.ecart } });
}
