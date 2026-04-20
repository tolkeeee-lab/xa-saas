import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import { getProduits } from '@/lib/supabase/getProduits';
import CaisseV3 from '@/features/caisse/v3/CaisseV3';

export const metadata = { title: 'Caisse POS — xà' };

export default async function CaissePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const boutiques = await getBoutiques(user.id);

  if (boutiques.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-xa-muted mb-4">Aucune boutique active.</p>
        <a
          href="/dashboard/boutiques/new"
          className="px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Créer une boutique
        </a>
      </div>
    );
  }

  const produits = await getProduits(boutiques[0].id);

  const caissierNom =
    (user.user_metadata as Record<string, string> | undefined)?.full_name ??
    (user.user_metadata as Record<string, string> | undefined)?.nom_complet ??
    user.email?.split('@')[0] ??
    'Caissier';

  return <CaisseV3 boutiques={boutiques} produits={produits} userId={user.id} caissierNom={caissierNom} />;
}
