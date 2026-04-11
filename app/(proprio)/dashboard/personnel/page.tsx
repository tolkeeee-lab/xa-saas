import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getPersonnel } from '@/lib/supabase/getPersonnel';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import PersonnelTable from '@/components/dashboard/PersonnelTable';

export const metadata = { title: 'Personnel — xà' };

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [employes, boutiques] = await Promise.all([
    getPersonnel(user.id),
    getBoutiques(user.id),
  ]);

  return <PersonnelTable employes={employes} boutiques={boutiques} />;
}
