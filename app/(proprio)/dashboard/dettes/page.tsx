import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getDettes } from '@/lib/supabase/getDettes';
import DettesPage from '@/features/dettes/DettesPage';
import { getBoutiques } from '@/lib/supabase/getBoutiques';

export default async function DettesServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [dettesData, boutiques] = await Promise.all([
    getDettes(user.id),
    getBoutiques(user.id),
  ]);

  return <DettesPage data={dettesData} boutiques={boutiques} />;
}
