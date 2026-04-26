import { redirect } from 'next/navigation';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { createClient } from '@/lib/supabase-server';
import PertesScreen from '@/features/pertes/PertesScreen';
import type { Boutique } from '@/types/database';

export const metadata = { title: 'Pertes — xà' };

export default async function PertesPage() {
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

  const activeBoutiqueId = role.boutiqueIdAssignee ?? boutiquesData[0]?.id ?? '';
  const isOwner = role.role === 'owner' || role.role === 'admin';

  return (
    <PertesScreen
      boutiques={boutiquesData}
      initialBoutiqueId={activeBoutiqueId}
      isOwner={isOwner}
    />
  );
}
