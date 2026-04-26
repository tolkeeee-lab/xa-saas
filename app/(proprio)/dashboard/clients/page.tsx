import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import ClientsScreen from '@/features/clients/ClientsScreen';

export const metadata = { title: 'Clients — xà CRM' };

export default async function ClientsServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <ClientsScreen />;
}

