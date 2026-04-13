import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getAlertesStock } from '@/lib/supabase/getAlertesStock';
import AlertesStockPage from '@/components/dashboard/AlertesStockPage';

export const metadata = { title: 'Alertes Stock — xà' };

export default async function AlertesStockServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const data = await getAlertesStock(user.id);
  return <AlertesStockPage data={data} />;
}
