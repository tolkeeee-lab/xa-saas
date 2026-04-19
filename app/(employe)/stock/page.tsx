import type { Metadata } from 'next';
import { requireEmployeSession } from '@/lib/employe-session';
import { getProduitsForEmploye, getProduitsCompletForGerant } from '@/lib/supabase/getProduitsForEmploye';
import EmployeStockPage from '@/features/employe/EmployeStockPage';

export const metadata: Metadata = { title: 'Stock — xà' };

export default async function StockPage() {
  const session = await requireEmployeSession();

  const produits =
    session.role === 'gerant'
      ? await getProduitsCompletForGerant(session)
      : await getProduitsForEmploye(session);

  return <EmployeStockPage produits={produits} session={session} />;
}
