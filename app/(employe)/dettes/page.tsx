import type { Metadata } from 'next';
import { requireEmployeSession } from '@/lib/employe-session-server';
import { getDettesForEmploye } from '@/lib/supabase/getDettesForEmploye';
import EmployeDettesPage from '@/features/employe/EmployeDettesPage';

export const metadata: Metadata = { title: 'Dettes — xà' };

export default async function DettesPage() {
  const session = await requireEmployeSession();

  const initialData = await getDettesForEmploye(session);

  return <EmployeDettesPage initialData={initialData} session={session} />;
}
