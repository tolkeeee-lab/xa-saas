import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getPeremptions } from '@/lib/supabase/getPeremptions';
import PerimesTable from '@/features/stocks/PerimesTable';

export const metadata = { title: 'Péremptions — xà' };

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const produits = await getPeremptions(user.id);

  return <PerimesTable produits={produits} />;
}
