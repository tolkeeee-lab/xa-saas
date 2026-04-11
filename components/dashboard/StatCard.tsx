import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  accent?: boolean;
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent,
}: StatCardProps) {
  return (
    <div
      className={`bg-xa-surface border border-xa-border rounded-xl p-5 flex flex-col gap-3 ${
        accent ? 'border-l-4 border-l-xa-accent' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-xa-muted uppercase tracking-wider">
          {title}
        </span>
        {icon && <span className="text-xa-muted">{icon}</span>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-xa-text">{value}</span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend === 'up'
                ? 'text-emerald-500'
                : trend === 'down'
                ? 'text-xa-danger'
                : 'text-xa-muted'
            }`}
          >
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-xa-muted">{subtitle}</p>}
    </div>
  );
}
