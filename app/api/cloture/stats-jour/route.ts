import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import type { ClotureCaisseJour } from '@/types/database';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/cloture/stats-jour?boutique_id=X&date=YYYY-MM-DD
 *
 * Returns live stats for the day:
 * - nb_transactions, ca_calcule, credits_accordes, retraits_valides
 * - cash_theorique (ca_calcule - credits_accordes - retraits_valides)
 * - cloture_existante (if already closed today)
 */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const boutique_id = searchParams.get('boutique_id');
  const date = searchParams.get('date');

  if (!boutique_id || !date) {
    return NextResponse.json({ error: 'Paramètres boutique_id et date requis' }, { status: 400 });
  }

  if (!ISO_DATE_RE.test(date)) {
    return NextResponse.json(
      { error: 'Format de date invalide (YYYY-MM-DD attendu)' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Check access
  const [{ data: ownedBoutique }, { data: assignedEmploye }] = await Promise.all([
    admin
      .from('boutiques')
      .select('id')
      .eq('id', boutique_id)
      .eq('proprietaire_id', user.id)
      .maybeSingle(),
    admin
      .from('employes')
      .select('id')
      .eq('boutique_id', boutique_id)
      .eq('proprietaire_id', user.id)
      .eq('actif', true)
      .maybeSingle(),
  ]);

  if (!ownedBoutique && !assignedEmploye) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  // Parallel fetches: transactions, credits, retraits, existing cloture
  const [txResult, creditResult, retraitResult, clotureResult] = await Promise.all([
    // All transactions for the day
    admin
      .from('transactions')
      .select('montant_total, mode_paiement')
      .eq('boutique_id', boutique_id)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd),

    // Credits accorded (dettes created today)
    admin
      .from('dettes')
      .select('montant')
      .eq('boutique_id', boutique_id)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd),

    // Retraits validated today
    admin
      .from('retraits_clients')
      .select('total')
      .eq('boutique_id', boutique_id)
      .eq('statut', 'retire')
      .gte('retired_at', dayStart)
      .lte('retired_at', dayEnd),

    // Already closed?
    admin
      .from('cloture_caisse_jour')
      .select('*')
      .eq('boutique_id', boutique_id)
      .eq('date_cloture', date)
      .maybeSingle(),
  ]);

  const transactions = txResult.data ?? [];
  const nb_transactions = transactions.length;
  const ca_calcule = transactions.reduce(
    (sum: number, t: { montant_total: number | null; mode_paiement: string | null }) =>
      sum + (t.montant_total ?? 0),
    0,
  );

  const credits_accordes = (creditResult.data ?? []).reduce(
    (sum: number, d: { montant: number | null }) => sum + (d.montant ?? 0),
    0,
  );

  const retraits_valides = (retraitResult.data ?? []).reduce(
    (sum: number, r: { total: number | null }) => sum + (r.total ?? 0),
    0,
  );

  // Cash theorique: CA encaissé en cash = CA - credits (simplifié)
  const cash_transactions = transactions
    .filter((t: { montant_total: number | null; mode_paiement: string | null }) =>
      t.mode_paiement === 'cash' || !t.mode_paiement,
    )
    .reduce(
      (sum: number, t: { montant_total: number | null; mode_paiement: string | null }) =>
        sum + (t.montant_total ?? 0),
      0,
    );

  const cash_theorique = Math.max(0, cash_transactions - credits_accordes - retraits_valides);

  return NextResponse.json({
    nb_transactions,
    ca_calcule,
    credits_accordes,
    retraits_valides,
    cash_theorique,
    cloture_existante: clotureResult.data as ClotureCaisseJour | null,
  });
}
