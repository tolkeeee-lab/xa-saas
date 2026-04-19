'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Boutique } from '@/types/database';
import type { InventaireAvecBoutique } from '@/lib/supabase/getInventaires';
import { formatDate, formatFCFA } from '@/lib/format';
import NouvelInventaireModal from './NouvelInventaireModal';

type Props = {
  boutiques: Boutique[];
  inventaires: InventaireAvecBoutique[];
  userId: string;
};

type ToastState = { message: string; type: 'success' | 'error' } | null;

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    en_cours: 'bg-powder-petal-500/20 text-powder-petal-400',
    valide: 'bg-aquamarine-500/20 text-aquamarine-500',
    annule: 'bg-xa-surface text-xa-muted border border-xa-border',
  };
  const label: Record<string, string> = {
    en_cours: 'En cours',
    valide: 'Validé',
    annule: 'Annulé',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[statut] ?? 'bg-xa-bg text-xa-muted'}`}>
      {label[statut] ?? statut}
    </span>
  );
}

function PerimetreBadge({ perimetre, categorie }: { perimetre: string; categorie: string | null }) {
  const labels: Record<string, string> = {
    complet: 'Complet',
    categorie: categorie ? `Catégorie : ${categorie}` : 'Catégorie',
    selection: 'Sélection',
  };
  return (
    <span className="text-xs text-xa-muted">
      {labels[perimetre] ?? perimetre}
    </span>
  );
}

export default function InventairesHome({ boutiques, inventaires: initialInventaires, userId }: Props) {
  const router = useRouter();
  const [inventaires, setInventaires] = useState(initialInventaires);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleCancel(inv: InventaireAvecBoutique) {
    if (!confirm(`Annuler l'inventaire du ${formatDate(inv.started_at)} ? Les stocks ne seront pas modifiés.`)) return;
    setCancellingId(inv.id);
    try {
      const res = await fetch(`/api/inventaires/${inv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'annule' }),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error ?? 'Erreur', 'error');
        return;
      }
      setInventaires((prev) => prev.map((i) => (i.id === inv.id ? { ...i, statut: 'annule' as const } : i)));
      showToast('Inventaire annulé', 'success');
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-aquamarine-500/20 text-aquamarine-400 border border-aquamarine-500/30'
              : 'bg-xa-danger/20 text-xa-danger border border-xa-danger/30'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-xa-ink" style={{ fontFamily: 'var(--font-familjen), sans-serif' }}>
            Inventaires
          </h1>
          <p className="text-sm text-xa-muted mt-0.5">
            Comptez votre stock réel et comparez avec le stock théorique
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvel inventaire
        </button>
      </div>

      {/* Inventaires list */}
      {inventaires.length === 0 ? (
        <div className="rounded-xl border border-xa-border bg-xa-surface p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-xa-bg flex items-center justify-center">
            <svg className="w-6 h-6 text-xa-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-xa-muted text-sm">Aucun inventaire pour l'instant</p>
          <p className="text-xa-muted/60 text-xs mt-1">Lancez votre premier inventaire pour comparer le stock réel et théorique</p>
        </div>
      ) : (
        <div className="rounded-xl border border-xa-border bg-xa-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Boutique</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Périmètre</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Statut</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Produits</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Écarts</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Valeur écart</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventaires.map((inv) => (
                  <tr key={inv.id} className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors">
                    <td className="px-5 py-3 text-xa-ink whitespace-nowrap">
                      {formatDate(inv.started_at)}
                    </td>
                    <td className="px-5 py-3 text-xa-ink">{inv.boutique.nom}</td>
                    <td className="px-5 py-3">
                      <PerimetreBadge perimetre={inv.perimetre} categorie={inv.categorie} />
                    </td>
                    <td className="px-5 py-3">
                      <StatutBadge statut={inv.statut} />
                    </td>
                    <td className="px-5 py-3 text-right text-xa-ink">{inv.nb_produits}</td>
                    <td className="px-5 py-3 text-right text-xa-ink">
                      {inv.statut === 'valide' ? (
                        <span>
                          {inv.nb_ecarts_negatifs > 0 && (
                            <span className="text-xa-danger mr-1">−{inv.nb_ecarts_negatifs}</span>
                          )}
                          {inv.nb_ecarts_positifs > 0 && (
                            <span className="text-powder-petal-400 mr-1">+{inv.nb_ecarts_positifs}</span>
                          )}
                          {inv.nb_ecarts_negatifs === 0 && inv.nb_ecarts_positifs === 0 && (
                            <span className="text-aquamarine-500">0</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xa-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {inv.statut === 'valide' ? (
                        <span className={inv.valeur_ecart_total < 0 ? 'text-xa-danger' : inv.valeur_ecart_total > 0 ? 'text-powder-petal-400' : 'text-aquamarine-500'}>
                          {inv.valeur_ecart_total >= 0 ? '+' : ''}{formatFCFA(inv.valeur_ecart_total)}
                        </span>
                      ) : (
                        <span className="text-xa-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.statut === 'en_cours' && (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/inventaire/${inv.id}`)}
                              className="px-3 py-1 rounded-lg bg-xa-primary/10 text-xa-primary text-xs font-medium hover:bg-xa-primary/20 transition-colors"
                            >
                              Reprendre
                            </button>
                            <button
                              onClick={() => handleCancel(inv)}
                              disabled={cancellingId === inv.id}
                              className="px-3 py-1 rounded-lg bg-xa-danger/10 text-xa-danger text-xs font-medium hover:bg-xa-danger/20 transition-colors disabled:opacity-50"
                            >
                              Annuler
                            </button>
                          </>
                        )}
                        {inv.statut === 'valide' && (
                          <button
                            onClick={() => router.push(`/dashboard/inventaire/${inv.id}`)}
                            className="px-3 py-1 rounded-lg bg-xa-surface text-xa-ink text-xs font-medium border border-xa-border hover:bg-xa-bg transition-colors"
                          >
                            Voir détail
                          </button>
                        )}
                        {inv.statut === 'annule' && (
                          <span className="text-xs text-xa-muted">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NouvelInventaireModal
          boutiques={boutiques}
          onClose={() => setShowModal(false)}
          onCreated={(inv) => {
            setShowModal(false);
            router.push(`/dashboard/inventaire/${inv.id}`);
          }}
        />
      )}
    </div>
  );
}
