'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PeakHoursData } from '@/lib/supabase/dashboard/peak-hours';

type Props = { data: PeakHoursData };

export default function PeakHoursCard({ data }: Props) {
  const chartData = data.hours
    .map((count, h) => ({ hour: `${h}H`, count }))
    .filter((_, h) => h >= 6 && h <= 22);

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
  const hasData = chartData.some((d) => d.count > 0);

  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">HEURES DE POINTE</span>
        <span className="xa-card-subtitle">Aujourd&apos;hui</span>
      </div>
      {!hasData ? (
        <div className="xa-card-empty">Aucune transaction aujourd&apos;hui</div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 9, fill: 'var(--xa-muted)' }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: 'var(--xa-surface)',
                border: '1px solid var(--xa-rule2)',
                borderRadius: 4,
                fontSize: 11,
              }}
              formatter={(v) => [v as number, 'transactions']}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.hour}
                  fill={entry.count === maxCount ? 'var(--xa-accent)' : 'var(--xa-bg3)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
