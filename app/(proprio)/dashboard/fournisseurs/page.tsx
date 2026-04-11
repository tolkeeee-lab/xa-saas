import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getFournisseurs } from '@/lib/supabase/getFournisseurs';
import FournisseursPage from '@/components/dashboard/FournisseursPage';
import { getBoutiques } from '@/lib/supabase/getBoutiques';

export default async function FournisseursServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [fournisseurs, boutiques] = await Promise.all([
    getFournisseurs(user.id),
    getBoutiques(user.id),
  ]);

  return <FournisseursPage fournisseurs={fournisseurs} boutiques={boutiques} />;
}
