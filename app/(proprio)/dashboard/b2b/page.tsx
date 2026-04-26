import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { Boutique, ProduitCatalogueAdmin } from '@/types/database';
import B2BScreen from '@/features/b2b/B2BScreen';

export const metadata = { title: 'Commander MAFRO — xà' };

export default async function B2BPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [{ data: boutiquesData }, { data: catalogueData }] = await Promise.all([
    admin
      .from('boutiques')
      .select('*')
      .eq('proprietaire_id', user.id)
      .order('created_at'),
    admin
      .from('produits_catalogue_admin')
      .select('*')
      .eq('est_actif', true)
      .order('nom')
      .limit(50),
  ]);

  const boutiques = (boutiquesData ?? []) as Boutique[];
  const catalogue = (catalogueData ?? []) as ProduitCatalogueAdmin[];

  if (boutiques.length === 0) redirect('/dashboard/settings');

  const categories = Array.from(
    new Set(catalogue.map((p) => p.categorie).filter((c): c is string => c !== null)),
  ).sort();

  return (
    <B2BScreen
      boutiques={boutiques}
      initialBoutiqueId={boutiques[0].id}
      initialCatalogue={catalogue}
      initialCategories={categories}
    />
  );
}
