'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CategoryData } from '@/lib/supabase/dashboard/categories';
import { formatFCFA } from '@/lib/format';

type Props = { data: CategoryData };

const COLORS = ['#00C853', '#2563EB', '#E53535', '#D97706', '#7C3AED', '#1DDB7B'];

type LegendPayload = {
  value?: string;
  payload?: { percent?: number };
};

export default function CategoriesDonut({ data }: Props) {
  if (!data.length) {
    return (
      <div className="xa-card">
        <div className="xa-card-header">
          <span className="xa-card-title">CATÉGORIES</span>
        </div>
        <div className="xa-card-empty">Aucune donnée disponible</div>
      </div>
    );
  }

  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">CATÉGORIES</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatFCFA(value), '']}
            contentStyle={{
              background: 'var(--xa-surface)',
              border: '1px solid var(--xa-rule2)',
              borderRadius: 4,
              fontSize: 11,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value: string, entry: LegendPayload) =>
              `${value} (${entry.payload?.percent ?? 0}%)`
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
