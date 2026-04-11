import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import { getTransferts } from '@/lib/supabase/getTransferts';
import TransfertsPage from '@/components/dashboard/TransfertsPage';

export const metadata = { title: 'Transferts inter-sites — xà' };

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [boutiques, transferts] = await Promise.all([
    getBoutiques(user.id),
    getTransferts(user.id),
  ]);

  // Fetch produits for all boutiques (without prix_achat)
  const boutiqueIds = boutiques.map((b) => b.id);
  const produits =
    boutiqueIds.length > 0
      ? await (async () => {
          const { data } = await supabase
            .from('produits')
            .select(
              'id, boutique_id, nom, categorie, description, prix_vente, stock_actuel, seuil_alerte, unite, actif, date_peremption, created_at, updated_at',
            )
            .in('boutique_id', boutiqueIds)
            .eq('actif', true)
            .order('nom', { ascending: true });
          return data ?? [];
        })()
      : [];

  return (
    <TransfertsPage boutiques={boutiques} produits={produits} transferts={transferts} />
  );
}
