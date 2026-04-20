import type { Metadata } from 'next';
import { requireEmployeSession } from '@/lib/employe-session-server';
import EmployeClotureForm from '@/features/employe/EmployeClotureForm';

export const metadata: Metadata = { title: 'Clôture — xà' };

export default async function CloturePage() {
  const session = await requireEmployeSession();

  return <EmployeClotureForm session={session} />;
}
