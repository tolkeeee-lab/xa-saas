import { createClient } from '@/lib/supabase-server';
import type { Fournisseur, CommandeFournisseur } from '@/types/database';

export type FournisseurAvecCommande = Fournisseur & {
  derniere_commande: CommandeFournisseur | null;
  total_annuel: number;
};

export async function getFournisseurs(userId: string): Promise<FournisseurAvecCommande[]> {
  const supabase = await createClient();

  const { data: fournisseurs } = await supabase
    .from('fournisseurs')
    .select('*')
    .eq('proprietaire_id', userId)
    .order('created_at', { ascending: false });

  if (!fournisseurs?.length) return [];

  const fournisseurIds = fournisseurs.map((f) => f.id);

  const startOfYear = new Date();
  startOfYear.setMonth(0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  const { data: commandes } = await supabase
    .from('commandes_fournisseur')
    .select('*')
    .in('fournisseur_id', fournisseurIds)
    .order('created_at', { ascending: false });

  const commandesByFournisseur = new Map<string, CommandeFournisseur[]>();
  for (const c of commandes ?? []) {
    const list = commandesByFournisseur.get(c.fournisseur_id) ?? [];
    list.push(c);
    commandesByFournisseur.set(c.fournisseur_id, list);
  }

  return fournisseurs.map((f) => {
    const allCommandes = commandesByFournisseur.get(f.id) ?? [];
    const derniere_commande = allCommandes[0] ?? null;
    const total_annuel = allCommandes
      .filter((c) => c.created_at >= startOfYear.toISOString())
      .reduce((sum, c) => sum + c.montant, 0);
    return { ...f, derniere_commande, total_annuel };
  });
}
