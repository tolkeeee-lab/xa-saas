import { createClient } from '@/lib/supabase-browser';

export type Notification = {
  id: string;
  type: 'stock_bas' | 'peremption' | 'dette';
  message: string;
  boutique_nom: string;
  created_at: string;
};

export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient();
  const notifs: Notification[] = [];

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id, nom')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiques?.length) return [];

  const boutiqueIds = boutiques.map((b: { id: string; nom: string }) => b.id);
  const boutiqueMap: Record<string, string> = Object.fromEntries(
    boutiques.map((b: { id: string; nom: string }) => [b.id, b.nom]),
  );

  // Stocks bas
  const { data: produitsBas } = await supabase
    .from('produits')
    .select('id, nom, boutique_id, stock_actuel, seuil_alerte')
    .in('boutique_id', boutiqueIds)
    .eq('actif', true)
    .limit(100);

  (produitsBas ?? []).forEach(
    (p: {
      id: string;
      nom: string;
      boutique_id: string;
      stock_actuel: number;
      seuil_alerte: number;
    }) => {
      if (p.stock_actuel <= p.seuil_alerte) {
        notifs.push({
          id: `stock-${p.id}`,
          type: 'stock_bas',
          message: `Stock bas : ${p.nom} (${p.stock_actuel} restant)`,
          boutique_nom: boutiqueMap[p.boutique_id] ?? '',
          created_at: new Date().toISOString(),
        });
      }
    },
  );

  // Péremptions dans 30 jours
  const in30days = new Date();
  in30days.setDate(in30days.getDate() + 30);
  const { data: perimes } = await supabase
    .from('produits')
    .select('id, nom, boutique_id, date_peremption')
    .in('boutique_id', boutiqueIds)
    .eq('actif', true)
    .not('date_peremption', 'is', null)
    .lte('date_peremption', in30days.toISOString().split('T')[0])
    .limit(10);

  (perimes ?? []).forEach(
    (p: { id: string; nom: string; boutique_id: string; date_peremption: string }) => {
      const daysLeft = Math.ceil(
        (new Date(p.date_peremption).getTime() - Date.now()) / 86400000,
      );
      notifs.push({
        id: `peremption-${p.id}`,
        type: 'peremption',
        message: `Péremption : ${p.nom} (J${daysLeft >= 0 ? '-' + daysLeft : '+' + Math.abs(daysLeft)})`,
        boutique_nom: boutiqueMap[p.boutique_id] ?? '',
        created_at: p.date_peremption,
      });
    },
  );

  // Dettes impayées
  const { data: dettes } = await supabase
    .from('dettes')
    .select('id, client_nom, montant, boutique_id')
    .in('boutique_id', boutiqueIds)
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: false })
    .limit(5);

  (dettes ?? []).forEach(
    (d: { id: string; client_nom: string; montant: number; boutique_id: string }) => {
      notifs.push({
        id: `dette-${d.id}`,
        type: 'dette',
        message: `Dette impayée : ${d.client_nom} — ${d.montant.toLocaleString('fr-FR')} FCFA`,
        boutique_nom: boutiqueMap[d.boutique_id] ?? '',
        created_at: new Date().toISOString(),
      });
    },
  );

  return notifs.slice(0, 20);
}
