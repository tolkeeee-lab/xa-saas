import type { Metadata } from 'next';
import { requireEmployeSession } from '@/lib/employe-session-server';
import { getClientsForEmploye } from '@/lib/supabase/getClientsForEmploye';
import EmployeClientsPage from '@/features/employe/EmployeClientsPage';

export const metadata: Metadata = { title: 'Clients — xà' };

export default async function ClientsPage() {
  const session = await requireEmployeSession();

  const initialData = await getClientsForEmploye(session);

  return <EmployeClientsPage initialData={initialData} session={session} />;
}
