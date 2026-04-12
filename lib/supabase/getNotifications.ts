import { createClient } from '@/lib/supabase-server';

export type AppNotification = {
  id: string;
  text: string;
  type: 'stock' | 'transfert' | 'charge';
};

export async function getNotifications(userId: string): Promise<AppNotification[]> {
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

  // 3. Charges fixes en retard (échéance passée, non payées)
  const { data: charges } = await supabase
    .from('charges_fixes')
    .select('id, nom, date_echeance, statut')
    .eq('proprietaire_id', userId)
    .eq('statut', 'impayee')
    .lt('date_echeance', new Date().toISOString().split('T')[0]);

  if ((charges?.length ?? 0) > 0) {
    notifs.push({
      id: 'charge-retard',
      text: `💳 ${charges!.length} charge${charges!.length > 1 ? 's' : ''} fixe${charges!.length > 1 ? 's' : ''} en retard`,
      type: 'charge',
    });
  }

  return notifs;
}
