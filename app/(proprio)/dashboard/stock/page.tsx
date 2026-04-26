import { redirect } from 'next/navigation';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { createClient } from '@/lib/supabase-server';
import StockLocalScreen from '@/features/stock/StockLocalScreen';
import type { Boutique } from '@/types/database';

export const metadata = { title: 'Stock local — xà' };

export default async function StockPage() {
  const role = await getEffectiveRole();
  if (!role) redirect('/login');

  const supabase = await createClient();

  // Load boutiques accessible to this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('boutiques').select('*').order('created_at');
  if (role!.role === 'owner') {
    query = query.eq('proprietaire_id', role!.userId);
  } else if (role!.role === 'manager' || role!.role === 'staff') {
    if (role!.boutiqueIdAssignee) {
      query = query.eq('id', role!.boutiqueIdAssignee);
    } else {
      redirect('/dashboard');
    }
  }
  // admins see all boutiques (no extra filter)

  const { data: boutiques } = await query;
  const boutiquesList = (boutiques ?? []) as Boutique[];

  if (boutiquesList.length === 0) {
    redirect('/dashboard/settings');
  }

  const activeBoutiqueId =
    role!.boutiqueIdAssignee ?? boutiquesList[0]?.id ?? '';

  return (
    <StockLocalScreen
      boutiques={boutiquesList}
      initialBoutiqueId={activeBoutiqueId}
    />
  );
}
