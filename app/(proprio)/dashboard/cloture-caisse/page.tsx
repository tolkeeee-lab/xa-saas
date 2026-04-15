import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getClotureCaisseData } from '@/lib/supabase/getClotureCaisse';
import ClotureCaissePage from '@/features/cloture/ClotureCaissePage';

export const metadata = { title: 'Clôture de caisse — xà' };

export default async function ClotureCaisseServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const data = await getClotureCaisseData(user.id);

  return <ClotureCaissePage data={data} />;
}
