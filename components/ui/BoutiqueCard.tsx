import type { Boutique } from '@/types/database';
import { formatFCFA } from '@/lib/format';
import Link from 'next/link';

type BoutiqueCardProps = {
  boutique: Boutique;
  ca: number;
  transactions: number;
  benefice: number;
};

export default function BoutiqueCard({
  boutique,
  ca,
  transactions,
  benefice,
}: BoutiqueCardProps) {
  const trend = ca > 0 ? 'up' : 'neutral';

  return (
    <div
      className="bg-xa-surface rounded-xl border border-xa-border p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        borderLeftColor: boutique.couleur_theme,
        borderLeftWidth: '4px',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-xa-text truncate">{boutique.nom}</h3>
            <span
              className="text-xs font-bold"
              style={{
                color: trend === 'up' ? '#17e8bb' : '#7c5aa8',
              }}
              title={trend === 'up' ? 'CA positif aujourd\'hui' : 'Pas de vente aujourd\'hui'}
            >
              {trend === 'up' ? '▲' : '—'}
            </span>
          </div>
          <p className="text-xs text-xa-muted">
            {boutique.ville}
            {boutique.quartier ? ` · ${boutique.quartier}` : ''}
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full text-white shrink-0 ml-2"
          style={{ backgroundColor: boutique.couleur_theme }}
        >
          {boutique.code_unique}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-xs text-xa-muted">CA aujourd&apos;hui</p>
          <p className="text-sm font-bold text-xa-text">{formatFCFA(ca)}</p>
        </div>
        <div>
          <p className="text-xs text-xa-muted">Transactions</p>
          <p className="text-sm font-bold text-xa-text">{transactions}</p>
        </div>
        <div>
          <p className="text-xs text-xa-muted">Bénéfice</p>
          <p className="text-sm font-bold text-aquamarine-600">{formatFCFA(benefice)}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Link
          href={`/dashboard/boutiques/${boutique.id}`}
          className="text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: boutique.couleur_theme }}
        >
          → Gérer
        </Link>
      </div>
    </div>
  );
}
