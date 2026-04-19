import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import { getInventaires } from '@/lib/supabase/getInventaires';
import InventairesHome from '@/features/inventaire/InventairesHome';

export const metadata = { title: 'Inventaires — xà' };

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [boutiques, inventaires] = await Promise.all([
    getBoutiques(user.id),
    getInventaires(user.id),
  ]);

  return <InventairesHome boutiques={boutiques} inventaires={inventaires} userId={user.id} />;
}
