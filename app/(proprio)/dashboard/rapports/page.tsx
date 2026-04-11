import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getRapports } from '@/lib/supabase/getRapports';
import RapportsPage from '@/components/dashboard/RapportsPage';

export default async function RapportsServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const rapports = await getRapports(user.id);

  return <RapportsPage data={rapports} />;
}
