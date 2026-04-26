'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, History, PackagePlus, PackageMinus, ArrowLeftRight, RefreshCw } from 'lucide-react';
import type { Produit } from '@/types/database';
import type { MouvementStock, MouvementStockType } from '@/types/database';

type MouvementWithUser = MouvementStock & { user_initiales?: string | null };

type Props = {
  produit: Produit;
  boutiqueId: string;
  onClose: () => void;
};

const TYPE_ICONS: Record<MouvementStockType, React.ReactNode> = {
  reception: <PackagePlus size={14} style={{ color: 'var(--xa-green)' }} />,
  sortie: <PackageMinus size={14} style={{ color: 'var(--xa-danger)' }} />,
  transfert_out: <ArrowLeftRight size={14} style={{ color: 'var(--xa-amber)' }} />,
  transfert_in: <ArrowLeftRight size={14} style={{ color: 'var(--xa-green)' }} />,
  ajustement: <RefreshCw size={14} style={{ color: 'var(--xa-blue)' }} />,
  inventaire: <RefreshCw size={14} style={{ color: 'var(--xa-purple)' }} />,
};

const TYPE_LABELS: Record<MouvementStockType, string> = {
  reception: 'Réception',
  sortie: 'Sortie',
  transfert_out: 'Transfert (→)',
  transfert_in: 'Transfert (←)',
  ajustement: 'Ajustement',
  inventaire: 'Inventaire',
};

function getDelta(m: MouvementStock): string {
  const delta = m.stock_apres - m.stock_avant;
  return delta >= 0 ? `+${delta}` : `${delta}`;
}

function getDeltaColor(m: MouvementStock): string {
  const delta = m.stock_apres - m.stock_avant;
  if (delta > 0) return 'var(--xa-green)';
  if (delta < 0) return 'var(--xa-danger)';
  return 'var(--xa-muted)';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoriqueModal({ produit, boutiqueId, onClose }: Props) {
  const [mouvements, setMouvements] = useState<MouvementWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<MouvementStockType | 'all'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/stock/produits/${produit.id}/historique?boutique_id=${boutiqueId}&limit=30`,
      );
      const data = (await res.json()) as { mouvements?: MouvementWithUser[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erreur de chargement.');
      } else {
        setMouvements(data.mouvements ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [produit.id, boutiqueId]);

  useEffect(() => { load(); }, [load]);

  const filtered = filterType === 'all'
    ? mouvements
    : mouvements.filter((m) => m.type === filterType);

  return (
    <div className="xa-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="xa-modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="historique-title"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="xa-modal-header">
          <div className="flex items-center gap-2">
            <History size={18} style={{ color: 'var(--xa-blue)' }} />
            <h3 id="historique-title" className="text-base font-semibold text-xa-text">
              Historique — {produit.nom}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="xa-modal-close"><X size={20} /></button>
        </div>

        {/* Filter by type */}
        <div className="px-5 pb-2 flex gap-1.5 overflow-x-auto">
          {(['all', 'reception', 'sortie', 'transfert_out', 'transfert_in', 'ajustement'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterType === t ? 'bg-xa-primary text-white' : 'bg-xa-bg2 text-xa-muted hover:text-xa-text'
              }`}
            >
              {t === 'all' ? 'Tous' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5">
          {loading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-xa-bg2 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-xa-danger py-4">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-xa-muted py-8 text-center">Aucun mouvement.</p>
          ) : (
            <ul className="space-y-2 mt-2">
              {filtered.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-xa-border bg-xa-surface"
                >
                  <span className="mt-0.5 flex-shrink-0">{TYPE_ICONS[m.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-xa-text">{TYPE_LABELS[m.type]}</span>
                      <span className="text-xs font-bold" style={{ color: getDeltaColor(m) }}>
                        {getDelta(m)} {produit.unite}
                      </span>
                    </div>
                    <p className="text-xs text-xa-muted mt-0.5">
                      {m.motif ? m.motif.replace(/_/g, ' ') : ''}
                      {m.note ? ` · ${m.note}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-xa-faint">{formatDate(m.created_at)}</span>
                      {m.user_initiales && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-xa-bg2 text-xa-muted">
                          {m.user_initiales}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-xa-muted">{m.stock_avant}</span>
                    <span className="text-xs text-xa-muted mx-1">→</span>
                    <span className="text-xs font-semibold text-xa-text">{m.stock_apres}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
