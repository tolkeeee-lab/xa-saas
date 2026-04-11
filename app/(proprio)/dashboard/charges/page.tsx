import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getChargesFixes } from '@/lib/supabase/getChargesFixes';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import ChargesFixesPage from '@/components/dashboard/ChargesFixesPage';

export const metadata = { title: 'Charges fixes — xà' };

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [data, boutiques] = await Promise.all([
    getChargesFixes(user.id),
    getBoutiques(user.id),
  ]);

  return <ChargesFixesPage data={data} boutiques={boutiques} />;
}
