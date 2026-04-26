'use client';

import { formatFCFA } from '@/lib/format';

type Props = {
  cashTheorique: number;
  cashCompte: number | null;
};

function getEcartStyle(ecart: number): { color: string; label: string } {
  if (ecart === 0) return { color: 'text-green-600', label: 'Équilibrée ✓' };
  if (ecart > 0) return { color: 'text-amber-500', label: `Excédent +${formatFCFA(ecart)}` };
  return { color: 'text-red-500', label: `Manque ${formatFCFA(ecart)}` };
}

export default function EcartPreview({ cashTheorique, cashCompte }: Props) {
  const ecart = cashCompte !== null ? cashCompte - cashTheorique : null;
  const style = ecart !== null ? getEcartStyle(ecart) : null;

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-xa-border bg-xa-surface p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-xa-muted">Cash théorique</span>
        <span className="font-semibold text-xa-text">{formatFCFA(cashTheorique)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-xa-muted">Cash compté</span>
        <span className="font-semibold text-xa-text">
          {cashCompte !== null ? formatFCFA(cashCompte) : '—'}
        </span>
      </div>
      <div className="border-t border-xa-border pt-3 flex justify-between items-center">
        <span className="text-sm font-medium text-xa-text">Écart</span>
        {style ? (
          <span className={`text-base font-bold transition-colors ${style.color}`}>
            {style.label}
          </span>
        ) : (
          <span className="text-xa-muted">—</span>
        )}
      </div>
    </div>
  );
}
