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

  // 3. Charges fixes actives
  // ChargeFixe n'a pas de champ "statut" — on filtre sur actif:true uniquement.
  // Si tu veux filtrer sur un statut de paiement, ajoute un champ statut dans
  // types/database.ts et dans le schéma Supabase.
  const { data: charges } = await supabase
    .from('charges_fixes')
    .select('id, libelle, actif')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  const chargesActives = charges ?? [];

  if (chargesActives.length > 0) {
    notifs.push({
      id: 'charge-retard',
      text: `💳 ${chargesActives.length} charge${chargesActives.length > 1 ? 's' : ''} fixe${chargesActives.length > 1 ? 's' : ''} active${chargesActives.length > 1 ? 's' : ''}`,
      type: 'charge',
    });
  }

  return notifs;
}