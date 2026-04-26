'use client';

import { Users, MessageCircle, CreditCard, Clock } from 'lucide-react';

type Props = {
  total: number;
  opt_in: number;
  avec_credit: number;
  inactifs: number;
};

export default function ClientStats({ total, opt_in, avec_credit, inactifs }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-xa-surface border-b border-xa-border">
      <div className="bg-xa-bg rounded-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-xa-primary/10 flex items-center justify-center flex-shrink-0">
          <Users size={18} className="text-xa-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-xa-text leading-none">{total}</p>
          <p className="text-xs text-xa-muted mt-0.5">Total clients</p>
        </div>
      </div>

      <div className="bg-xa-bg rounded-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <MessageCircle size={18} className="text-green-600" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-xa-text leading-none">{opt_in}</p>
          <p className="text-xs text-xa-muted mt-0.5">Opt-in WA</p>
        </div>
      </div>

      <div className="bg-xa-bg rounded-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <CreditCard size={18} className="text-amber-600" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-xa-text leading-none">{avec_credit}</p>
          <p className="text-xs text-xa-muted mt-0.5">Avec crédit</p>
        </div>
      </div>

      <div className="bg-xa-bg rounded-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-xa-muted/10 flex items-center justify-center flex-shrink-0">
          <Clock size={18} className="text-xa-muted" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-xa-text leading-none">{inactifs}</p>
          <p className="text-xs text-xa-muted mt-0.5">Inactifs +30j</p>
        </div>
      </div>
    </div>
  );
}
