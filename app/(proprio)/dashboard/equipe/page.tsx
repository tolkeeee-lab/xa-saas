import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getPersonnel } from '@/lib/supabase/getPersonnel';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import EquipeView from '@/features/equipe/EquipeView';

export const metadata = { title: 'Équipe — xà' };

export default async function EquipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [employes, boutiques] = await Promise.all([
    getPersonnel(user.id),
    getBoutiques(user.id),
  ]);

  return <EquipeView employes={employes} boutiques={boutiques} />;
}
