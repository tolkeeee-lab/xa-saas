import { redirect } from 'next/navigation';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { createClient } from '@/lib/supabase-server';
import TransfertsScreen from '@/features/transferts/TransfertsScreen';
import type { Boutique } from '@/types/database';

export const metadata = { title: 'Transferts inter-boutiques — xà' };

export default async function TransfertsPage() {
  const role = await getEffectiveRole();
  if (!role) redirect('/login');

  const supabase = await createClient();

  let boutiquesData: Boutique[] = [];

  if (role.role === 'owner') {
    const { data } = await supabase
      .from('boutiques')
      .select('*')
      .eq('proprietaire_id', role.userId)
      .order('created_at');
    boutiquesData = (data ?? []) as Boutique[];
  } else if (role.role === 'manager' || role.role === 'staff') {
    if (!role.boutiqueIdAssignee) redirect('/dashboard');
    const { data } = await supabase
      .from('boutiques')
      .select('*')
      .eq('id', role.boutiqueIdAssignee)
      .order('created_at');
    boutiquesData = (data ?? []) as Boutique[];
  } else {
    const { data } = await supabase.from('boutiques').select('*').order('created_at');
    boutiquesData = (data ?? []) as Boutique[];
  }

  if (boutiquesData.length === 0) {
    redirect('/dashboard/settings');
  }

  // Pre-load produits for all accessible boutiques (for name display in list)
  const boutiqueIds = boutiquesData.map((b) => b.id);
  const { data: produitsData } = await supabase
    .from('produits')
    .select('id, nom, categorie')
    .in('boutique_id', boutiqueIds)
    .eq('actif', true)
    .order('nom', { ascending: true });

  const produits = (produitsData ?? []).map((p: { id: string; nom: string; categorie: string | null }) => ({
    id: p.id,
    nom: p.nom,
    categorie: p.categorie,
  }));

  return <TransfertsScreen boutiques={boutiquesData} produits={produits} />;
}
