'use client';

import { ShoppingCart, TrendingUp, CreditCard, ArrowDownCircle } from 'lucide-react';
import { formatFCFA } from '@/lib/format';

type Props = {
  nbTransactions: number;
  caCalcule: number;
  creditsAccordes: number;
  retraitsValides: number;
  loading?: boolean;
};

export default function ClotureSummary({
  nbTransactions,
  caCalcule,
  creditsAccordes,
  retraitsValides,
  loading,
}: Props) {
  const cards = [
    {
      icon: ShoppingCart,
      label: 'Transactions',
      value: loading ? '—' : String(nbTransactions),
      color: 'text-xa-primary',
    },
    {
      icon: TrendingUp,
      label: 'CA du jour',
      value: loading ? '—' : formatFCFA(caCalcule),
      color: 'text-green-600',
    },
    {
      icon: CreditCard,
      label: 'Crédits accordés',
      value: loading ? '—' : formatFCFA(creditsAccordes),
      color: 'text-amber-500',
    },
    {
      icon: ArrowDownCircle,
      label: 'Retraits validés',
      value: loading ? '—' : formatFCFA(retraitsValides),
      color: 'text-violet-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {cards.map(({ icon: Icon, label, value, color }) => (
        <div
          key={label}
          className="bg-xa-surface rounded-2xl p-4 border border-xa-border flex flex-col gap-1"
        >
          <Icon size={18} className={color} />
          <span className="text-xs text-xa-muted">{label}</span>
          <span className="text-base font-bold text-xa-text">{value}</span>
        </div>
      ))}
    </div>
  );
}
