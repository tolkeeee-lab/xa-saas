import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import type { Boutique } from '@/types/database';

export type AlerteStockRow = {
  id: string;
  nom: string;
  categorie: string;
  boutique_id: string;
  boutique_nom: string;
  boutique_couleur: string;
  stock_actuel: number;
  seuil_alerte: number;
  statut: 'rupture' | 'bas';
};

export type AlertesStockData = {
  alertes: AlerteStockRow[];
  nb_ruptures: number;
  nb_bas: number;
};

export function getAlertesStock(userId: string): Promise<AlertesStockData> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      const { data: boutiquesData } = await supabase
        .from('boutiques')
        .select('id, nom, couleur_theme')
        .eq('proprietaire_id', userId)
        .eq('actif', true);

      const boutiques: Pick<Boutique, 'id' | 'nom' | 'couleur_theme'>[] = boutiquesData ?? [];
      const boutiqueIds = boutiques.map((b) => b.id);

      if (boutiqueIds.length === 0) {
        return { alertes: [], nb_ruptures: 0, nb_bas: 0 };
      }

      const { data: produits } = await supabase
        .from('produits')
        .select('id, boutique_id, nom, categorie, stock_actuel, seuil_alerte')
        .in('boutique_id', boutiqueIds)
        .eq('actif', true)
        .order('stock_actuel', { ascending: true });

      const alertes: AlerteStockRow[] = [];
      let nb_ruptures = 0;
      let nb_bas = 0;

      for (const p of produits ?? []) {
        const boutique = boutiques.find((b) => b.id === p.boutique_id);
        if (!boutique) continue;

        if (p.stock_actuel === 0) {
          alertes.push({
            id: p.id,
            nom: p.nom,
            categorie: (p.categorie as string | null) ?? 'Général',
            boutique_id: p.boutique_id,
            boutique_nom: boutique.nom,
            boutique_couleur: boutique.couleur_theme,
            stock_actuel: p.stock_actuel,
            seuil_alerte: p.seuil_alerte,
            statut: 'rupture',
          });
          nb_ruptures++;
        } else if (p.stock_actuel > 0 && p.stock_actuel <= p.seuil_alerte) {
          alertes.push({
            id: p.id,
            nom: p.nom,
            categorie: (p.categorie as string | null) ?? 'Général',
            boutique_id: p.boutique_id,
            boutique_nom: boutique.nom,
            boutique_couleur: boutique.couleur_theme,
            stock_actuel: p.stock_actuel,
            seuil_alerte: p.seuil_alerte,
            statut: 'bas',
          });
          nb_bas++;
        }
      }

      return { alertes, nb_ruptures, nb_bas };
    },
    ['alertes-stock', userId],
    { revalidate: 60, tags: [`alertes-stock-${userId}`] },
  )();
}
