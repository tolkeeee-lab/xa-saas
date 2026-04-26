import { redirect } from 'next/navigation';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { createClient } from '@/lib/supabase-server';
import RetraitsScreen from '@/features/retraits/RetraitsScreen';
import type { Boutique } from '@/types/database';

export const metadata = { title: 'Retraits clients — xà' };

export default async function RetraitsPage() {
  const role = await getEffectiveRole();
  if (!role) redirect('/login');

  const supabase = await createClient();

  let boutiquesData: Boutique[] = [];

  if (role!.role === 'owner') {
    const { data } = await supabase
      .from('boutiques')
      .select('*')
      .eq('proprietaire_id', role!.userId)
      .order('created_at');
    boutiquesData = (data ?? []) as Boutique[];
  } else if (role!.role === 'manager' || role!.role === 'staff') {
    if (!role!.boutiqueIdAssignee) redirect('/dashboard');
    const { data } = await supabase
      .from('boutiques')
      .select('*')
      .eq('id', role!.boutiqueIdAssignee)
      .order('created_at');
    boutiquesData = (data ?? []) as Boutique[];
  } else {
    // admin — all boutiques
    const { data } = await supabase
      .from('boutiques')
      .select('*')
      .order('created_at');
    boutiquesData = (data ?? []) as Boutique[];
  }

  if (boutiquesData.length === 0) {
    redirect('/dashboard/settings');
  }

  const activeBoutiqueId = role!.boutiqueIdAssignee ?? boutiquesData[0]?.id ?? '';
  const isOwner = role!.role === 'owner' || role!.role === 'admin';
  const employeId = role!.employeId ?? role!.proprietaireId ?? role!.userId;

  return (
    <RetraitsScreen
      boutiques={boutiquesData}
      initialBoutiqueId={activeBoutiqueId}
      isOwner={isOwner}
      employeId={employeId}
    />
  );
}
