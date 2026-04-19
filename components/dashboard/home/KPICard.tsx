import { formatFCFA } from '@/lib/format';

type Props = {
  label: string;
  value: number | string;
  delta?: number;
  suffix?: string;
  formatAsCurrency?: boolean;
  icon?: string;
};

export default function KPICard({ label, value, delta, suffix, formatAsCurrency, icon }: Props) {
  const displayValue =
    formatAsCurrency && typeof value === 'number'
      ? formatFCFA(value)
      : `${typeof value === 'number' ? value.toLocaleString('fr-FR') : value}${suffix ?? ''}`;

  const isPositive = (delta ?? 0) >= 0;

  return (
    <div className="xa-kpi-card">
      <div className="xa-kpi-top">
        <span className="xa-kpi-label">{label}</span>
        {icon && <span className="xa-kpi-icon">{icon}</span>}
      </div>
      <div className="xa-kpi-value">{displayValue}</div>
      {delta !== undefined && (
        <div className={`xa-kpi-delta ${isPositive ? 'xa-kpi-delta-up' : 'xa-kpi-delta-down'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(delta)}%
          <span className="xa-kpi-delta-label"> vs période précédente</span>
        </div>
      )}
    </div>
  );
}
