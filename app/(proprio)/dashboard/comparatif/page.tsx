import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getComparatif } from '@/lib/supabase/getComparatif';
import ComparatifPage from '@/components/dashboard/ComparatifPage';

export const metadata = { title: 'Comparatif boutiques — xà' };

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const data = await getComparatif(user.id);

  return <ComparatifPage boutiques={data.boutiques} ruptures={data.ruptures} />;
}
