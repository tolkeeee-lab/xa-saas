import type { Boutique } from '@/types/database';
import { formatFCFA } from '@/lib/format';

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
  return (
    <div
      className="bg-xa-surface rounded-xl border border-xa-border p-5"
      style={{ borderLeftColor: boutique.couleur_theme, borderLeftWidth: '4px' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-xa-text">{boutique.nom}</h3>
          <p className="text-xs text-xa-muted">
            {boutique.ville}
            {boutique.quartier ? ` · ${boutique.quartier}` : ''}
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: boutique.couleur_theme }}
        >
          {boutique.code_unique}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
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
          <p className="text-sm font-bold text-emerald-500">{formatFCFA(benefice)}</p>
        </div>
      </div>
    </div>
  );
}
