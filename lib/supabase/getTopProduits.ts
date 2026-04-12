import { createClient } from '@/lib/supabase-server';

export type TopProduit = {
  produit_id: string | null;
  nom: string;
  quantite_totale: number;
  ca_total: number;
  boutique_id?: string;
  boutique_nom?: string;
};

export type TopProduitsParBoutique = {
  boutique_id: string;
  boutique_nom: string;
  produits: TopProduit[];
};

export type TopProduitsResult = {
  global: TopProduit[];
  parBoutique: TopProduitsParBoutique[];
};

export async function getTopProduits(
  userId: string,
  dateDebut: string,
  dateFin: string,
  boutiqueId?: string,
): Promise<TopProduitsResult> {
  const supabase = await createClient();

  // Get user's active boutiques
  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id, nom')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiques?.length) {
    return { global: [], parBoutique: [] };
  }

  const startISO = `${dateDebut}T00:00:00.000Z`;
  const endISO = `${dateFin}T23:59:59.999Z`;

  // Filter boutiques if a specific one is requested
  const targetBoutiques =
    boutiqueId && boutiqueId !== 'all'
      ? boutiques.filter((b) => b.id === boutiqueId)
      : boutiques;

  if (!targetBoutiques.length) {
    return { global: [], parBoutique: [] };
  }

  const boutiqueIds = targetBoutiques.map((b) => b.id);

  // Step 1: get validated transaction IDs for the boutiques and date range
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, boutique_id')
    .in('boutique_id', boutiqueIds)
    .eq('statut', 'validee')
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  if (!transactions?.length) {
    return {
      global: [],
      parBoutique: targetBoutiques.map((b) => ({
        boutique_id: b.id,
        boutique_nom: b.nom,
        produits: [],
      })),
    };
  }

  const txIds = transactions.map((t) => t.id);
  const txBoutiqueMap = new Map(transactions.map((t) => [t.id, t.boutique_id]));

  // Step 2: get all lignes for those transactions
  const { data: lignes } = await supabase
    .from('transaction_lignes')
    .select('produit_id, nom_produit, quantite, sous_total, transaction_id')
    .in('transaction_id', txIds);

  if (!lignes?.length) {
    return {
      global: [],
      parBoutique: targetBoutiques.map((b) => ({
        boutique_id: b.id,
        boutique_nom: b.nom,
        produits: [],
      })),
    };
  }

  // Aggregate globally
  const globalMap = new Map<
    string,
    { produit_id: string | null; nom: string; quantite_totale: number; ca_total: number }
  >();

  for (const row of lignes) {
    const key = row.produit_id ?? `__nom__${row.nom_produit}`;
    const existing = globalMap.get(key);
    if (existing) {
      existing.quantite_totale += row.quantite;
      existing.ca_total += row.sous_total;
    } else {
      globalMap.set(key, {
        produit_id: row.produit_id,
        nom: row.nom_produit,
        quantite_totale: row.quantite,
        ca_total: row.sous_total,
      });
    }
  }

  const global: TopProduit[] = Array.from(globalMap.values()).sort(
    (a, b) => b.quantite_totale - a.quantite_totale,
  );

  // Aggregate per boutique
  const boutiqueNomMap = new Map(targetBoutiques.map((b) => [b.id, b.nom]));

  const perBoutiqueMap = new Map<
    string,
    Map<string, { produit_id: string | null; nom: string; quantite_totale: number; ca_total: number }>
  >();

  for (const row of lignes) {
    const bid = txBoutiqueMap.get(row.transaction_id);
    if (!bid) continue;
    if (!perBoutiqueMap.has(bid)) {
      perBoutiqueMap.set(bid, new Map());
    }
    const bMap = perBoutiqueMap.get(bid)!;
    const key = row.produit_id ?? `__nom__${row.nom_produit}`;
    const existing = bMap.get(key);
    if (existing) {
      existing.quantite_totale += row.quantite;
      existing.ca_total += row.sous_total;
    } else {
      bMap.set(key, {
        produit_id: row.produit_id,
        nom: row.nom_produit,
        quantite_totale: row.quantite,
        ca_total: row.sous_total,
      });
    }
  }

  const parBoutique: TopProduitsParBoutique[] = targetBoutiques.map((b) => {
    const bMap = perBoutiqueMap.get(b.id);
    const produits: TopProduit[] = bMap
      ? Array.from(bMap.values())
          .sort((a, b) => b.quantite_totale - a.quantite_totale)
          .map((p) => ({ ...p, boutique_id: b.id, boutique_nom: boutiqueNomMap.get(b.id) ?? b.id }))
      : [];
    return { boutique_id: b.id, boutique_nom: b.nom, produits };
  });

  return { global, parBoutique };
}

