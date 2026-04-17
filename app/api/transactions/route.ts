import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { transactionsPostSchema } from '@/lib/schemas/transactions';
import { revalidateUserCache } from '@/lib/revalidate';
import {
  calculatePrix,
  calculatePointsGagnes,
  POINTS_REMISE_SEUIL,
} from '@/lib/pricing';

/**
 * GET /api/transactions?boutique_id=UUID&date=YYYY-MM-DD
 * Returns validated transactions for a boutique on a given day, with an aggregate summary.
 */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { error: authError } = await getAuthUser();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const boutique_id = searchParams.get('boutique_id');
  const date = searchParams.get('date');

  if (!boutique_id) {
    return NextResponse.json({ error: 'boutique_id requis' }, { status: 400 });
  }

  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(targetDate)) {
    return NextResponse.json({ error: 'Format de date invalide, utilisez YYYY-MM-DD' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const startISO = `${targetDate}T00:00:00.000Z`;
  const endISO = `${targetDate}T23:59:59.999Z`;

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, montant_total, mode_paiement, created_at, statut')
    .eq('boutique_id', boutique_id)
    .eq('statut', 'validee')
    .gte('created_at', startISO)
    .lte('created_at', endISO)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const txs = transactions ?? [];

  const total_encaisse = txs.reduce((s, t) => s + (t.montant_total ?? 0), 0);
  const nb_transactions = txs.length;
  const par_mode: Record<string, number> = {};
  for (const t of txs) {
    const m = t.mode_paiement ?? 'especes';
    par_mode[m] = (par_mode[m] ?? 0) + (t.montant_total ?? 0);
  }

  return NextResponse.json({
    transactions: txs.slice(0, 20),
    total_encaisse,
    nb_transactions,
    par_mode,
  });
}


/**
 * POST /api/transactions
 * Creates a transaction with its lines, updates stock, and returns a ticket.
 * prix_achat is fetched server-side only — never returned to client.
 * If mode_paiement === 'credit', a dette is automatically created.
 * If client_id is provided, loyalty points are updated server-side.
 * Supports idempotency via optional local_id: if a transaction with the same
 * local_id already exists it is returned as-is (no duplicate insertion).
 */
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(transactionsPostSchema, rawBody);
  if (validationError) return validationError;

  const { boutique_id, lignes, mode_paiement, montant_total, local_id, client_id } = body;

  const supabase = createAdminClient();

  // ── Idempotency check (C8) ───────────────────────────────────────────────
  // If local_id was provided, check whether this sale was already processed.
  if (local_id) {
    const { data: existing } = await supabase
      .from('transactions')
      .select('id, created_at, montant_total, mode_paiement')
      .eq('local_id', local_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        transaction_id: existing.id,
        created_at: existing.created_at,
        lignes: [],
        montant_total: existing.montant_total,
        remise: 0,
        mode_paiement: existing.mode_paiement,
        client: null,
      });
    }
  }

  // ── Product validation (C9) ──────────────────────────────────────────────
  const produitIds = lignes.map((l) => l.produit_id);
  const { data: produitsData, error: produitsError } = await supabase
    .from('produits')
    .select('id, prix_achat, stock_actuel')
    .in('id', produitIds);

  if (produitsError) {
    return NextResponse.json({ error: produitsError.message }, { status: 500 });
  }

  const produitMap = new Map((produitsData ?? []).map((p) => [p.id, p]));

  for (const ligne of lignes) {
    const produit = produitMap.get(ligne.produit_id);
    if (!produit) {
      return NextResponse.json({ error: `Produit introuvable: ${ligne.produit_id}` }, { status: 422 });
    }
    if (produit.stock_actuel < ligne.quantite) {
      return NextResponse.json({ error: `Stock insuffisant pour le produit ${ligne.produit_id}` }, { status: 422 });
    }
  }

  // ── Server-side total revalidation (C3) ─────────────────────────────────
  // Look up the client to determine whether their loyalty discount applies.
  let hasClientRemise = false;
  let clientData: { id: string; points: number; total_achats: number; nb_visites: number } | null = null;

  if (client_id) {
    const { data: clientRow } = await supabase
      .from('clients')
      .select('id, points, total_achats, nb_visites')
      .eq('id', client_id)
      .maybeSingle();

    if (clientRow) {
      clientData = clientRow;
      hasClientRemise = clientRow.points >= POINTS_REMISE_SEUIL;
    }
  }

  const { remise, montantTotal: montantTotalServeur } = calculatePrix(lignes, hasClientRemise);

  // Reject if client-sent total deviates by more than 1 FCFA (rounding tolerance)
  if (Math.abs(montant_total - montantTotalServeur) > 1) {
    return NextResponse.json(
      { error: `Montant total invalide (attendu ${montantTotalServeur} FCFA)` },
      { status: 422 },
    );
  }

  const benefice_total = lignes.reduce((sum, ligne) => {
    const produit = produitMap.get(ligne.produit_id);
    const marge = produit ? ligne.prix_unitaire - produit.prix_achat : 0;
    return sum + marge * ligne.quantite;
  }, 0);

  // ── Insert transaction ───────────────────────────────────────────────────
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      boutique_id,
      montant_total: montantTotalServeur,
      benefice_total,
      montant_recu: montantTotalServeur,
      monnaie_rendue: 0,
      mode_paiement,
      client_id: client_id ?? null,
      client_nom: body.client_nom ?? null,
      statut: 'validee',
      sync_statut: 'synced',
      local_id: local_id ?? null,
    })
    .select('id, created_at')
    .single();

  if (txError || !transaction) {
    return NextResponse.json({ error: txError?.message ?? 'Erreur transaction' }, { status: 500 });
  }

  // ── Fetch product names for ticket ──────────────────────────────────────
  const { data: nomsProduits } = await supabase
    .from('produits')
    .select('id, nom')
    .in('id', produitIds);

  const nomsMap = new Map((nomsProduits ?? []).map((p) => [p.id, p.nom]));

  // ── Insert transaction lines ─────────────────────────────────────────────
  const lignesInsertFull = lignes.map((ligne) => {
    const produit = produitMap.get(ligne.produit_id)!;
    return {
      transaction_id: transaction.id,
      produit_id: ligne.produit_id,
      nom_produit: nomsMap.get(ligne.produit_id) ?? 'Produit',
      quantite: ligne.quantite,
      prix_vente_unitaire: ligne.prix_unitaire,
      prix_achat_unitaire: produit.prix_achat,
      sous_total: ligne.prix_unitaire * ligne.quantite,
    };
  });

  const { error: lignesError } = await supabase
    .from('transaction_lignes')
    .insert(lignesInsertFull);

  if (lignesError) {
    return NextResponse.json({ error: lignesError.message }, { status: 500 });
  }

  // ── Update stock levels in parallel (C9 Option A) ───────────────────────
  // Running updates concurrently instead of sequentially to reduce latency.
  // Note: this is not a SQL transaction — if one update fails the others still
  // commit. The migration in supabase/migrations/*_process_sale_rpc.sql
  // provides the fully atomic Option B for a future sprint.
  const stockResults = await Promise.all(
    lignes.map((ligne) => {
      const produit = produitMap.get(ligne.produit_id)!;
      return supabase
        .from('produits')
        .update({ stock_actuel: produit.stock_actuel - ligne.quantite })
        .eq('id', ligne.produit_id);
    }),
  );

  const stockErrors = stockResults.filter((r) => r.error);
  if (stockErrors.length > 0) {
    // Log stock update failures but do not block the response — the
    // transaction is already committed and the ticket must be printed.
    console.error('[transactions] stock update failures:', stockErrors.map((r) => r.error?.message));
  }

  // ── Credit sale → create dette ───────────────────────────────────────────
  if (mode_paiement === 'credit') {
    const DEFAULT_CREDIT_DAYS = 30;
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + DEFAULT_CREDIT_DAYS);
    await supabase.from('dettes').insert({
      boutique_id,
      client_nom: body.client_nom ?? 'Client anonyme',
      client_telephone: body.client_telephone ?? null,
      montant: montantTotalServeur,
      montant_rembourse: 0,
      description: `Vente crédit - ${lignes.length} article(s)`,
      statut: 'en_attente',
      date_echeance: dateEcheance.toISOString().split('T')[0],
    });
  }

  // ── Update loyalty points server-side (C10) ──────────────────────────────
  let updatedClient: { id: string; points: number; total_achats: number; nb_visites: number } | null = null;

  if (client_id && clientData) {
    const pointsGagnes = calculatePointsGagnes(montantTotalServeur);
    // If the loyalty discount was used (≥ 100 points), points reset to 0 then
    // new points for this purchase are added.
    const newPoints = hasClientRemise
      ? pointsGagnes
      : clientData.points + pointsGagnes;

    const { data: updatedClientRow } = await supabase
      .from('clients')
      .update({
        points: Math.max(0, newPoints),
        total_achats: clientData.total_achats + montantTotalServeur,
        nb_visites: clientData.nb_visites + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', client_id)
      .select('id, points, total_achats, nb_visites')
      .single();

    if (updatedClientRow) {
      updatedClient = updatedClientRow;
    }
  }

  // ── Build ticket (no prix_achat returned) ───────────────────────────────
  const ticketLignes = lignes.map((l) => ({
    produit_id: l.produit_id,
    nom: nomsMap.get(l.produit_id) ?? 'Produit',
    quantite: l.quantite,
    prix_unitaire: l.prix_unitaire,
    sous_total: l.prix_unitaire * l.quantite,
  }));

  const txCacheTags = ['alertes-stock', 'notifications', 'stocks-consolides', 'weekly-stats', 'rapports'];
  if (mode_paiement === 'credit') txCacheTags.push('dettes');
  if (client_id) txCacheTags.push('clients');
  revalidateUserCache(user.id, txCacheTags);

  return NextResponse.json({
    transaction_id: transaction.id,
    created_at: transaction.created_at,
    lignes: ticketLignes,
    montant_total: montantTotalServeur,
    remise,
    mode_paiement,
    client: updatedClient,
  });
}

  return NextResponse.json({
    transaction_id: transaction.id,
    created_at: transaction.created_at,
    lignes: ticketLignes,
    montant_total: montantTotalServeur,
    remise,
    mode_paiement,
    client: updatedClient,
  });
}