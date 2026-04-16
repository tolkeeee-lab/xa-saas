import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase-server';

export type AppNotification = {
  id: string;
  text: string;
  type: 'stock' | 'transfert' | 'charge';
};

export function getNotifications(userId: string): Promise<AppNotification[]> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      const notifs: AppNotification[] = [];

      // 1. Alertes stock (produits sous seuil)
      const { data: boutiques } = await supabase
        .from('boutiques')
        .select('id')
        .eq('proprietaire_id', userId);

      if (boutiques?.length) {
        const boutiqueIds = boutiques.map((b) => b.id);
        const { data: produits } = await supabase
          .from('produits')
          .select('id, nom, stock_actuel, seuil_alerte')
          .in('boutique_id', boutiqueIds)
          .eq('actif', true);

        const alertes = (produits ?? []).filter(
          (p) => p.stock_actuel <= p.seuil_alerte,
        );
        if (alertes.length > 0) {
          notifs.push({
            id: 'stock-alerte',
            text: `⚠️ ${alertes.length} produit${alertes.length > 1 ? 's' : ''} sous seuil de stock`,
            type: 'stock',
          });
        }

        // 2. Transferts en attente
        const { data: transferts } = await supabase
          .from('transferts')
          .select('id')
          .in('boutique_destination_id', boutiqueIds)
          .eq('statut', 'en_transit');

        if ((transferts?.length ?? 0) > 0) {
          notifs.push({
            id: 'transfert-attente',
            text: `📦 ${transferts!.length} transfert${transferts!.length > 1 ? 's' : ''} en attente de validation`,
            type: 'transfert',
          });
        }
      }

      return notifs;
    },
    ['notifications', userId],
    { revalidate: 60, tags: [`notifications-${userId}`] },
  )();
}
