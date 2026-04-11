import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

type PayMode = 'especes' | 'momo' | 'carte' | 'credit';

type LigneInput = {
  produit_id: string;
  quantite: number;
  prix_unitaire: number; // prix_vente
};

type TransactionBody = {
  boutique_id: string;
  lignes: LigneInput[];
  mode_paiement: PayMode;
  montant_total: number;
};

/**
 * POST /api/transactions
 * Creates a transaction with its lines, updates stock, and returns a ticket.
 * prix_achat is fetched server-side only — never returned to client.
 */
export async function POST(request: NextRequest) {
  let body: TransactionBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { boutique_id, lignes, mode_paiement, montant_total } = body;

  if (!boutique_id || !lignes?.length || !mode_paiement || montant_total == null) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

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
    nom_produit: nomsMap.get(l.produit_id ?? '') ?? 'Produit',
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

  return NextResponse.json({
    transaction_id: transaction.id,
    created_at: transaction.created_at,
    lignes: ticketLignes,
    montant_total,
    remise,
    mode_paiement,
  });
}
