import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getTransactions } from '@/lib/supabase/getTransactions';
import TransactionsPage from '@/features/rapports/TransactionsPage';

export const metadata = { title: 'Ventes — xà' };

export default async function VentesServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const data = await getTransactions(user.id);
  return <TransactionsPage data={data} />;
}
