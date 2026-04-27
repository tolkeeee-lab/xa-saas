import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import StockV4 from '@/features/stock-v4/StockV4';

export const metadata = { title: 'Stocks — xà' };

export default async function StocksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const boutiques = await getBoutiques(user.id);

  if (boutiques.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-xa-muted mb-4">Aucune boutique active.</p>
      </div>
    );
  }

  return <StockV4 boutiques={boutiques} userId={user.id} />;
}
