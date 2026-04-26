'use client';

import type { CommandeB2B } from '@/types/database';

type Props = {
  commande: CommandeB2B;
  onClick: () => void;
};

const STATUT_CONFIG: Record<CommandeB2B['statut'], { label: string; bg: string }> = {
  soumise: { label: 'Soumise', bg: 'var(--xa-muted)' },
  confirmee: { label: 'Confirmée', bg: 'var(--xa-blue)' },
  preparee: { label: 'Préparée', bg: 'var(--xa-amber)' },
  en_route: { label: 'En route', bg: 'var(--xa-purple)' },
  livree: { label: 'Livrée', bg: 'var(--xa-green)' },
  annulee: { label: 'Annulée', bg: 'var(--xa-red)' },
};

export default function B2BCommandeCard({ commande, onClick }: Props) {
  const config = STATUT_CONFIG[commande.statut];
  const date = new Date(commande.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="bg-xa-surface border border-xa-border rounded-2xl p-4 cursor-pointer hover:border-xa-primary transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-xa-text text-sm">{commande.numero}</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: config.bg, color: '#fff' }}
        >
          {config.label}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-bold text-xa-text">
          {commande.total.toLocaleString('fr-FR')} FCFA
        </span>
        <span className="text-xa-muted text-sm">{date}</span>
      </div>
    </div>
  );
}
