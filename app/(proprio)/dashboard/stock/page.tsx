import { redirect } from 'next/navigation';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { createClient } from '@/lib/supabase-server';
import StockLocalScreen from '@/features/stock/StockLocalScreen';
import HubQuickLinks from '@/features/dashboard/HubQuickLinks';
import {
  Package,
  BarChart3,
  ArrowLeftRight,
  ClipboardList,
  CalendarX,
  TrendingDown,
  Bell,
  Tag,
} from 'lucide-react';
import type { Boutique } from '@/types/database';

export const metadata = { title: 'Stock local — xà' };

const STOCK_LINKS = [
  { href: '/dashboard/stock',         icon: Package,       label: 'Stock local',         description: 'Gestion de votre stock', isCurrent: true },
  { href: '/dashboard/stocks',        icon: BarChart3,     label: 'Stocks consolidés',   description: 'Vue multi-boutiques' },
  { href: '/dashboard/transferts',    icon: ArrowLeftRight,label: 'Transferts',           description: 'Mouvements inter-boutiques' },
  { href: '/dashboard/inventaire',    icon: ClipboardList, label: 'Inventaire',           description: 'Comptage & ajustement' },
  { href: '/dashboard/perimes',       icon: CalendarX,     label: 'Périmés',              description: 'Produits en fin de vie' },
  { href: '/dashboard/pertes',        icon: TrendingDown,  label: 'Pertes',               description: 'Casse & pertes' },
  { href: '/dashboard/alertes-stock', icon: Bell,          label: 'Alertes stock',        description: 'Seuils dépassés' },
  { href: '/dashboard/produits',      icon: Tag,           label: 'Produits',             description: 'Catalogue produits' },
];

export default async function StockPage() {
  const role = await getEffectiveRole();
  if (!role) redirect('/login');

  const supabase = await createClient();

  // Load boutiques accessible to this user
  let boutiquesData: Boutique[] = [];

  if (role!.role === 'owner') {
    const { data } = await supabase
      .from('boutiques')
      .select('*')
      .eq('proprietaire_id', role!.userId)
      .order('created_at');
    boutiquesData = (data ?? []) as Boutique[];
  } else if (role!.role === 'manager' || role!.role === 'staff') {
    if (!role!.boutiqueIdAssignee) redirect('/dashboard');
    const { data } = await supabase
      .from('boutiques')
      .select('*')
      .eq('id', role!.boutiqueIdAssignee)
      .order('created_at');
    boutiquesData = (data ?? []) as Boutique[];
  } else {
    // admin — all boutiques
    const { data } = await supabase
      .from('boutiques')
      .select('*')
      .order('created_at');
    boutiquesData = (data ?? []) as Boutique[];
  }

  if (boutiquesData.length === 0) {
    redirect('/dashboard/settings');
  }

  const activeBoutiqueId = role!.boutiqueIdAssignee ?? boutiquesData[0]?.id ?? '';

  return (
    <div>
      <HubQuickLinks items={STOCK_LINKS} />
      <StockLocalScreen
        boutiques={boutiquesData}
        initialBoutiqueId={activeBoutiqueId}
      />
    </div>
  );
}

