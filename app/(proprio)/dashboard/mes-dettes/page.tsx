import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getDettesProprioData } from '@/lib/supabase/getDettesProprioData';
import MesDettesPage from '@/features/dettes/MesDettesPage';

export const metadata = { title: 'Mes dettes — xà' };

export default async function MesDettesServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const dettesData = await getDettesProprioData(user.id);

  return <MesDettesPage data={dettesData} />;
}
