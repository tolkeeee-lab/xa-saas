import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireEmployeSession } from '@/lib/employe-session-server';
import InventaireGerantPage from '@/features/employe/InventaireGerantPage';

export const metadata: Metadata = { title: 'Inventaire — xà' };

export default async function InventairePage() {
  const session = await requireEmployeSession();

  // Only gerant can access inventaire
  if (session.role !== 'gerant') {
    redirect('/caisse');
  }

  return <InventaireGerantPage session={session} />;
}
