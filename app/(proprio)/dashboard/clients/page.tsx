import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getClients } from '@/lib/supabase/getClients';
import ClientsPage from '@/components/dashboard/ClientsPage';

export const metadata = { title: 'Clients fidèles — xà' };

export default async function ClientsServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const data = await getClients(user.id);
  return <ClientsPage data={data} />;
}
