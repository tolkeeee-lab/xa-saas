'use client';
import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { RevenueSeries } from '@/lib/supabase/dashboard/revenue';
import { formatFCFA } from '@/lib/format';

type Props = { data: RevenueSeries };

export default function RevenueChart({ data }: Props) {
  const [mode, setMode] = useState<'global' | 'boutiques'>('global');

  if (!data.labels.length) {
    return <div className="xa-card xa-card-empty">Aucune donnée disponible</div>;
  }

  const chartData = data.labels.map((label, i) => {
    const row: Record<string, number | string> = { label, global: data.global[i] };
    for (const s of data.byStore) {
      row[s.id] = s.data[i];
    }
    return row;
  });

  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">CHIFFRE D&apos;AFFAIRES</span>
        <div className="xa-toggle-group">
          <button
            className={`xa-toggle${mode === 'global' ? ' xa-toggle-active' : ''}`}
            onClick={() => setMode('global')}
          >
            GLOBAL
          </button>
          <button
            className={`xa-toggle${mode === 'boutiques' ? ' xa-toggle-active' : ''}`}
            onClick={() => setMode('boutiques')}
          >
            BOUTIQUES
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--xa-green)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--xa-green)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--xa-rule)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--xa-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--xa-muted)' }}
            axisLine={false}
            tickLine={false}
            width={60}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            formatter={(value) => [formatFCFA(value as number), '']}
            contentStyle={{
              background: 'var(--xa-surface)',
              border: '1px solid var(--xa-rule2)',
              borderRadius: 4,
              fontSize: 12,
            }}
          />
          {mode === 'global' ? (
            <Area
              type="monotone"
              dataKey="global"
              stroke="var(--xa-green)"
              fill="url(#colorGlobal)"
              strokeWidth={2}
              dot={false}
            />
          ) : (
            data.byStore.map((s) => (
              <Area
                key={s.id}
                type="monotone"
                dataKey={s.id}
                name={s.name}
                stroke={s.color}
                fill="none"
                strokeWidth={2}
                dot={false}
              />
            ))
          )}
          {mode === 'boutiques' && <Legend wrapperStyle={{ fontSize: 11 }} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
