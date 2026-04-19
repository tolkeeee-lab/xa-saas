import type { Metadata } from 'next';
import { requireEmployeSession } from '@/lib/employe-session';
import { getVentesForEmploye } from '@/lib/supabase/getVentesForEmploye';
import EmployeVentesPage from '@/features/employe/EmployeVentesPage';

export const metadata: Metadata = { title: 'Ventes — xà' };

export default async function VentesPage() {
  const session = await requireEmployeSession();

  const initialData = await getVentesForEmploye(session);

  return <EmployeVentesPage initialData={initialData} session={session} />;
}
