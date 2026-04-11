import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import { getStocksConsolides } from '@/lib/supabase/getStocksConsolides';
import StocksTable from '@/components/dashboard/StocksTable';

export const metadata = { title: 'Stocks consolidés — xà' };

export default async function StocksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [boutiques, stocksData] = await Promise.all([
    getBoutiques(user.id),
    getStocksConsolides(user.id),
  ]);

  return (
    <div className="space-y-5">
      <StocksTable data={stocksData} boutiques={boutiques} />
    </div>
  );
}
