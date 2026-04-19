import KPICard from './KPICard';
import type { KPIData } from '@/lib/supabase/dashboard/kpis';

type Props = { data: KPIData };

export default function KPIGrid({ data }: Props) {
  return (
    <div className="xa-kpi-grid">
      <KPICard
        label="VOLUME DES VENTES"
        value={data.volume.value}
        delta={data.volume.delta}
        formatAsCurrency
        icon="💰"
      />
      <KPICard
        label="TRANSACTIONS"
        value={data.orders.value}
        delta={data.orders.delta}
        icon="🧾"
      />
      <KPICard
        label="VISITEURS EST."
        value={data.visitors.value}
        delta={data.visitors.delta}
        icon="👥"
      />
      <KPICard
        label="ALERTES STOCK"
        value={data.stockAlerts.value}
        icon="⚠️"
      />
    </div>
  );
}
