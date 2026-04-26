'use client';

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { formatFCFA, formatDateTime } from '@/lib/format';
import type { ClotureCaisseJour } from '@/types/database';

const STATUT_CONFIG: Record<
  ClotureCaisseJour['statut'],
  { label: string; classes: string }
> = {
  a_valider: { label: 'À valider', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  equilibree: { label: 'Équilibrée', classes: 'bg-green-100 text-green-700 border-green-200' },
  manque: { label: 'Manque', classes: 'bg-red-100 text-red-700 border-red-200' },
  excedent: { label: 'Excédent', classes: 'bg-violet-100 text-violet-700 border-violet-200' },
};

type Props = {
  cloture: ClotureCaisseJour;
  isOwner: boolean;
  onClose: () => void;
  onValidated?: () => void;
};

export default function ClotureDetailModal({
  cloture,
  isOwner,
  onClose,
  onValidated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = STATUT_CONFIG[cloture.statut];
  const ecartSign = cloture.ecart > 0 ? '+' : '';
  const ecartColor =
    cloture.ecart === 0
      ? 'text-green-600'
      : cloture.ecart > 0
      ? 'text-amber-500'
      : 'text-red-500';

  async function handleValidate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cloture/${cloture.id}/validate`, { method: 'POST' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Erreur serveur');
        return;
      }
      onValidated?.();
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  function formatShortDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return (
    <div className="xa-modal-backdrop">
      <div className="xa-modal-box">
        <div className="xa-modal-body">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-xa-text text-lg capitalize">
                {formatShortDate(cloture.date_cloture)}
              </h2>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.classes}`}
              >
                {config.label}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xa-muted hover:text-xa-text p-1"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stats */}
          <div className="bg-xa-bg rounded-2xl p-4 flex flex-col gap-2 mb-4 border border-xa-border">
            <Row label="Transactions" value={String(cloture.nb_transactions)} />
            <Row label="CA calculé" value={formatFCFA(cloture.ca_calcule)} />
            <Row label="Crédits accordés" value={formatFCFA(cloture.credits_accordes)} />
            <Row label="Retraits validés" value={formatFCFA(cloture.retraits_valides)} />
            <div className="border-t border-xa-border pt-2" />
            <Row label="Cash compté" value={formatFCFA(cloture.cash_compte)} bold />
            <div className="flex justify-between items-center">
              <span className="text-sm text-xa-muted">Écart</span>
              <span className={`font-bold ${ecartColor}`}>
                {ecartSign}
                {formatFCFA(cloture.ecart)}
              </span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-col gap-1 mb-4 text-sm text-xa-muted">
            {cloture.ouverture_at && (
              <span>Ouverture : {formatDateTime(cloture.ouverture_at)}</span>
            )}
            {cloture.fermeture_at && (
              <span>Fermeture : {formatDateTime(cloture.fermeture_at)}</span>
            )}
            {cloture.valide_at && (
              <span>Validée le : {formatDateTime(cloture.valide_at)}</span>
            )}
          </div>

          {/* Note */}
          {cloture.note && (
            <div className="bg-xa-surface rounded-xl p-3 mb-4 border border-xa-border text-sm text-xa-text">
              <span className="text-xa-muted text-xs block mb-1">Note</span>
              {cloture.note}
            </div>
          )}

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          {/* Validate button for owner */}
          {isOwner && cloture.statut === 'a_valider' && (
            <button
              type="button"
              onClick={() => void handleValidate()}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-xa-primary text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle size={16} />
              {loading ? 'Validation…' : 'Valider la clôture'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-3 py-3 rounded-2xl border border-xa-border text-xa-text text-sm font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-xa-muted">{label}</span>
      <span className={bold ? 'font-semibold text-xa-text' : 'text-xa-text'}>{value}</span>
    </div>
  );
}
