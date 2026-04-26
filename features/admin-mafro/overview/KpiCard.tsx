import {
  TrendingUp,
  ShoppingCart,
  Truck,
  Store,
  AlertTriangle,
  Undo2,
} from 'lucide-react';

type KpiColor = 'green' | 'amber' | 'red' | 'blue' | 'purple';
type KpiIcon =
  | 'trending-up'
  | 'shopping-cart'
  | 'truck'
  | 'store'
  | 'alert-triangle'
  | 'undo-2';

type Props = {
  label: string;
  value: string | number;
  icon: KpiIcon;
  color: KpiColor;
};

const ICONS: Record<KpiIcon, React.ComponentType<{ size: number }>> = {
  'trending-up': TrendingUp,
  'shopping-cart': ShoppingCart,
  truck: Truck,
  store: Store,
  'alert-triangle': AlertTriangle,
  'undo-2': Undo2,
};

export default function KpiCard({ label, value, icon, color }: Props) {
  const Icon = ICONS[icon];
  return (
    <div className={`xa-kpi-card xa-kpi-card--${color}`}>
      <div className="xa-kpi-card__icon">
        <Icon size={22} />
      </div>
      <div className="xa-kpi-card__body">
        <div className="xa-kpi-card__value">{value}</div>
        <div className="xa-kpi-card__label">{label}</div>
      </div>
    </div>
  );
}
