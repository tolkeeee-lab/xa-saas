import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { transactionsPostSchema } from '@/lib/schemas/transactions';
import { revalidateUserCache } from '@/lib/revalidate';

/**
 * GET /api/transactions?boutique_id=UUID&date=YYYY-MM-DD
 * Returns validated transactions for a boutique on a given day, with an aggregate summary.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request);
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
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request);
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

  const { boutique_id, lignes, mode_paiement, montant_total } = body;

  const supabase = createAdminClient();

  // Fetch prix_achat for all products to compute benefice_total server-side
  const produitIds = lignes.map((l) => l.produit_id);
  const { data: produitsData, error: produitsError } = await supabase
    .from('produits')
    .select('id, prix_achat, stock_actuel')
    .in('id', produitIds);

  if (produitsError) {
    return NextResponse.json({ error: produitsError.message }, { status: 500 });
  }

  const produitMap = new Map((produitsData ?? []).map((p) => [p.id, p]));

  // Validate stock and compute benefice
  for (const ligne of lignes) {
    const produit = produitMap.get(ligne.produit_id);
    if (!produit) {
      return NextResponse.json({ error: `Produit introuvable: ${ligne.produit_id}` }, { status: 422 });
    }
    if (produit.stock_actuel < ligne.quantite) {
      return NextResponse.json({ error: `Stock insuffisant pour le produit ${ligne.produit_id}` }, { status: 422 });
    }
  }

  const benefice_total = lignes.reduce((sum, ligne) => {
    const produit = produitMap.get(ligne.produit_id);
    const marge = produit ? ligne.prix_unitaire - produit.prix_achat : 0;
    return sum + marge * ligne.quantite;
  }, 0);

  // Insert transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      boutique_id,
      montant_total,
      benefice_total,
      montant_recu: montant_total,
      monnaie_rendue: 0,
      mode_paiement,
      client_nom: body.client_nom ?? null,
      statut: 'validee',
      sync_statut: 'synced',
    })
    .select('id, created_at')
    .single();

  if (txError || !transaction) {
    return NextResponse.json({ error: txError?.message ?? 'Erreur transaction' }, { status: 500 });
  }

  // Insert transaction lines
  const lignesInsert = lignes.map((ligne) => {
    const produit = produitMap.get(ligne.produit_id)!;
    return {
      transaction_id: transaction.id,
      produit_id: ligne.produit_id,
      nom_produit: '', // will be enriched below if needed
      quantite: ligne.quantite,
      prix_vente_unitaire: ligne.prix_unitaire,
      prix_achat_unitaire: produit.prix_achat,
      sous_total: ligne.prix_unitaire * ligne.quantite,
    };
  });

  // Fetch product names for the ticket
  const { data: nomsProduits } = await supabase
    .from('produits')
    .select('id, nom')
    .in('id', produitIds);

  const nomsMap = new Map((nomsProduits ?? []).map((p) => [p.id, p.nom]));

  const lignesInsertFull = lignesInsert.map((l) => ({
    ...l,
    nom_produit: nomsMap.get(l.produit_id) ?? 'Produit',
  }));

  const { error: lignesError } = await supabase
    .from('transaction_lignes')
    .insert(lignesInsertFull);

  if (lignesError) {
    return NextResponse.json({ error: lignesError.message }, { status: 500 });
  }

  // Update stock for each product
  for (const ligne of lignes) {
    const produit = produitMap.get(ligne.produit_id)!;
    await supabase
      .from('produits')
      .update({ stock_actuel: produit.stock_actuel - ligne.quantite })
      .eq('id', ligne.produit_id);
  }

  // If mode credit → create a dette automatically (J+30 by default)
  if (mode_paiement === 'credit') {
    const DEFAULT_CREDIT_DAYS = 30;
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + DEFAULT_CREDIT_DAYS);
    await supabase.from('dettes').insert({
      boutique_id,
      client_nom: body.client_nom ?? 'Client anonyme',
      client_telephone: body.client_telephone ?? null,
      montant: montant_total,
      montant_rembourse: 0,
      description: `Vente crédit - ${lignes.length} article(s)`,
      statut: 'en_attente',
      date_echeance: dateEcheance.toISOString().split('T')[0],
    });
  }

  // Build ticket (no prix_achat returned)
  const sousTotal = lignes.reduce((s, l) => s + l.prix_unitaire * l.quantite, 0);
  const remise = sousTotal >= 50000 ? Math.round(sousTotal * 0.05) : 0;

  const ticketLignes = lignes.map((l) => ({
    produit_id: l.produit_id,
    nom: nomsMap.get(l.produit_id) ?? 'Produit',
    quantite: l.quantite,
    prix_unitaire: l.prix_unitaire,
    sous_total: l.prix_unitaire * l.quantite,
  }));

  // Invalidate all caches affected by a new transaction:
  // stock levels, notifications, consolidated stocks, weekly stats, and rapports
  // (monthly report data). If this is a credit sale, also invalidate dettes cache.
  const txCacheTags = ['alertes-stock', 'notifications', 'stocks-consolides', 'weekly-stats', 'rapports'];
  if (mode_paiement === 'credit') txCacheTags.push('dettes');
  revalidateUserCache(user.id, txCacheTags);

  return NextResponse.json({
    transaction_id: transaction.id,
    created_at: transaction.created_at,
    lignes: ticketLignes,
    montant_total,
    remise,
    mode_paiement,
  });
}