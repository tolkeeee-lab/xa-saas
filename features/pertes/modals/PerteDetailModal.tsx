'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertTriangle, BookCheck } from 'lucide-react';
import { formatFCFA, formatDateTime } from '@/lib/format';
import type { PerteDeclaration } from '@/types/database';
import MotifPill from '@/features/pertes/components/MotifPill';

type PerteStatut = PerteDeclaration['statut'];

const STATUT_CONFIG: Record<PerteStatut, { label: string; classes: string }> = {
  declaree: { label: 'Déclarée', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  validee: { label: 'Validée', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  contestee: { label: 'Contestée', classes: 'bg-red-100 text-red-700 border-red-200' },
  comptabilisee: {
    label: 'Comptabilisée',
    classes: 'bg-green-100 text-green-700 border-green-200',
  },
};

type Props = {
  perte: PerteDeclaration;
  isOwner: boolean;
  onClose: () => void;
  onContester: () => void;
  onRefresh: () => void;
};

export default function PerteDetailModal({ perte, isOwner, onClose, onContester, onRefresh }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);

  const statut = STATUT_CONFIG[perte.statut];

  async function handleValider() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pertes/${perte.id}/valider`, { method: 'POST' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur');
      onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  async function handleComptabiliser() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pertes/${perte.id}/comptabiliser`, { method: 'POST' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur');
      onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="xa-modal-backdrop">
        <div className="xa-modal-box">
          <div className="xa-modal-body">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-xa-text text-lg">{perte.produit_nom}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <MotifPill motif={perte.motif} />
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statut.classes}`}
                  >
                    {statut.label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-xa-muted hover:text-xa-text p-1 flex-shrink-0"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Photo */}
            {perte.photo_url && (
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="w-full aspect-video rounded-2xl overflow-hidden border border-xa-border mb-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={perte.photo_url}
                  alt="Justificatif"
                  className="w-full h-full object-cover"
                />
              </button>
            )}

            {/* Details */}
            <div className="bg-xa-bg rounded-2xl p-4 flex flex-col gap-2 mb-4 border border-xa-border">
              <Row label="Quantité" value={`${perte.quantite} unité${perte.quantite > 1 ? 's' : ''}`} />
              <Row label="Valeur estimée" value={formatFCFA(perte.valeur_estimee)} bold />
              <Row label="Déclarée le" value={formatDateTime(perte.created_at)} />
              {perte.valide_at && (
                <Row label="Traitée le" value={formatDateTime(perte.valide_at)} />
              )}
            </div>

            {/* Note */}
            {perte.note && (
              <div className="bg-xa-surface rounded-xl p-3 mb-4 border border-xa-border text-sm text-xa-text">
                <span className="text-xa-muted text-xs block mb-1">Note</span>
                {perte.note}
              </div>
            )}

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            {/* Actions */}
            {isOwner && perte.statut === 'declaree' && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void handleValider()}
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-xa-primary text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {loading ? 'Validation…' : 'Valider la perte'}
                </button>
                <button
                  type="button"
                  onClick={onContester}
                  disabled={loading}
                  className="w-full py-3 rounded-2xl border border-red-200 text-red-600 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <AlertTriangle size={16} />
                  Contester
                </button>
              </div>
            )}

            {isOwner && perte.statut === 'validee' && (
              <button
                type="button"
                onClick={() => void handleComptabiliser()}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-green-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <BookCheck size={16} />
                {loading ? 'Traitement…' : 'Marquer comptabilisée'}
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

      {/* Lightbox */}
      {lightbox && perte.photo_url && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white"
            aria-label="Fermer"
          >
            <X size={28} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={perte.photo_url}
            alt="Justificatif plein écran"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-xa-muted">{label}</span>
      <span className={bold ? 'font-semibold text-xa-text' : 'text-xa-text'}>{value}</span>
    </div>
  );
}
