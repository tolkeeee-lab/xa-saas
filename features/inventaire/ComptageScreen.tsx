'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { InventaireDetail, LigneAvecProduit } from '@/lib/supabase/getInventaires';
import { formatDate, formatFCFA } from '@/lib/format';

type Props = {
  inventaire: InventaireDetail;
};

type ToastState = { message: string; type: 'success' | 'error' } | null;
type Filter = 'tous' | 'comptes' | 'non_comptes' | 'avec_ecart';

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
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[statut] ?? 'bg-xa-bg text-xa-muted'}`}>
      {label[statut] ?? statut}
    </span>
  );
}

function EcartCell({ ecart }: { ecart: number | null }) {
  if (ecart === null) {
    return <span className="text-xa-muted text-sm">—</span>;
  }
  if (ecart === 0) {
    return <span className="text-aquamarine-500 text-sm font-medium">🟢 0</span>;
  }
  if (ecart < 0) {
    return <span className="text-xa-danger text-sm font-medium">🔴 {ecart}</span>;
  }
  return <span className="text-powder-petal-400 text-sm font-medium">🟡 +{ecart}</span>;
}

export default function ComptageScreen({ inventaire: initialInventaire }: Props) {
  const router = useRouter();
  const [inventaire] = useState(initialInventaire);
  const [lignes, setLignes] = useState<LigneAvecProduit[]>(initialInventaire.lignes);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('tous');
  const [toast, setToast] = useState<ToastState>(null);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [validating, setValidating] = useState(false);
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const isReadOnly = inventaire.statut !== 'en_cours';

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Calcul des stats
  const nbComptes = lignes.filter((l) => l.stock_compte !== null).length;
  const nbTotal = lignes.length;
  const allCounted = nbComptes === nbTotal;

  // Filtrage
  const filtered = lignes.filter((l) => {
    const matchSearch = search === '' || l.produit.nom.toLowerCase().includes(search.toLowerCase());
    let matchFilter = true;
    if (filter === 'comptes') matchFilter = l.stock_compte !== null;
    if (filter === 'non_comptes') matchFilter = l.stock_compte === null;
    if (filter === 'avec_ecart') matchFilter = l.stock_compte !== null && l.ecart !== 0;
    return matchSearch && matchFilter;
  });

  // Calcul des récaps pour le modal de validation
  const ecartTotal = lignes.reduce((sum, l) => sum + (l.stock_compte !== null ? l.ecart * l.prix_vente_snapshot : 0), 0);
  const perteTotal = lignes.reduce((sum, l) => {
    const e = l.stock_compte !== null ? l.ecart * l.prix_vente_snapshot : 0;
    return sum + (e < 0 ? e : 0);
  }, 0);
  const surplusTotal = lignes.reduce((sum, l) => {
    const e = l.stock_compte !== null ? l.ecart * l.prix_vente_snapshot : 0;
    return sum + (e > 0 ? e : 0);
  }, 0);
  const nbEcarts = lignes.filter((l) => l.stock_compte !== null && l.ecart !== 0).length;

  // Update stock_compte (debounced)
  const handleStockChange = useCallback(
    (ligne: LigneAvecProduit, value: string) => {
      const numVal = value === '' ? null : parseFloat(value);

      // Update local state immediately for live écart display
      setLignes((prev) =>
        prev.map((l) =>
          l.id === ligne.id
            ? {
                ...l,
                stock_compte: numVal,
                ecart: numVal !== null ? numVal - l.stock_theorique : 0,
              }
            : l,
        ),
      );

      if (numVal === null) return;

      // Debounce API call
      if (debounceRefs.current[ligne.id]) {
        clearTimeout(debounceRefs.current[ligne.id]);
      }
      debounceRefs.current[ligne.id] = setTimeout(async () => {
        try {
          const res = await fetch(`/api/inventaires/${inventaire.id}/lignes/${ligne.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock_compte: numVal }),
          });
          if (!res.ok) {
            const d = await res.json();
            showToast(d.error ?? 'Erreur de sauvegarde', 'error');
          }
        } catch {
          showToast('Erreur réseau', 'error');
        }
      }, 500);
    },
    [inventaire.id],
  );

  async function handleValidate() {
    setValidating(true);
    try {
      const res = await fetch(`/api/inventaires/${inventaire.id}/validate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? 'Erreur de validation', 'error');
        setShowValidateModal(false);
        return;
      }
      showToast('Inventaire validé. Stocks mis à jour.', 'success');
      setTimeout(() => router.push('/dashboard/inventaire'), 1500);
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setValidating(false);
      setShowValidateModal(false);
    }
  }

  return (
    <div className="space-y-5">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push('/dashboard/inventaire')}
              className="text-xa-muted hover:text-xa-ink transition-colors text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Inventaires
            </button>
            <StatutBadge statut={inventaire.statut} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-xa-ink" style={{ fontFamily: 'var(--font-familjen), sans-serif' }}>
            {inventaire.boutique.nom}
          </h1>
          <div className="flex items-center gap-3 text-sm text-xa-muted flex-wrap">
            <span>Démarré le {formatDate(inventaire.started_at)}</span>
            <span>·</span>
            <span>
              {inventaire.perimetre === 'complet'
                ? 'Inventaire complet'
                : inventaire.perimetre === 'categorie' && inventaire.categorie
                ? `Catégorie : ${inventaire.categorie}`
                : 'Inventaire partiel'}
            </span>
            {inventaire.note && (
              <>
                <span>·</span>
                <span className="italic">{inventaire.note}</span>
              </>
            )}
          </div>
          {/* Progress bar */}
          {!isReadOnly && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-xa-muted">
                <span>{nbComptes} / {nbTotal} produits comptés</span>
                <span>{nbTotal > 0 ? Math.round((nbComptes / nbTotal) * 100) : 0}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-xa-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-xa-primary transition-all"
                  style={{ width: `${nbTotal > 0 ? (nbComptes / nbTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isReadOnly && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative group">
              <button
                onClick={() => allCounted && setShowValidateModal(true)}
                disabled={!allCounted}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  allCounted
                    ? 'bg-aquamarine-500 text-white hover:bg-aquamarine-600'
                    : 'bg-xa-border text-xa-muted cursor-not-allowed'
                }`}
              >
                Valider l'inventaire
              </button>
              {!allCounted && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-xa-ink text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {nbTotal - nbComptes} produit(s) non comptés
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary stats for validated inventory */}
      {inventaire.statut === 'valide' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-xa-border bg-xa-surface p-4">
            <div className="text-xs text-xa-muted mb-1">Produits comptés</div>
            <div className="text-xl font-bold text-xa-ink">{inventaire.nb_produits}</div>
          </div>
          <div className="rounded-xl border border-xa-border bg-xa-surface p-4">
            <div className="text-xs text-xa-muted mb-1">Écarts négatifs</div>
            <div className="text-xl font-bold text-xa-danger">{inventaire.nb_ecarts_negatifs}</div>
          </div>
          <div className="rounded-xl border border-xa-border bg-xa-surface p-4">
            <div className="text-xs text-xa-muted mb-1">Écarts positifs</div>
            <div className="text-xl font-bold text-powder-petal-400">{inventaire.nb_ecarts_positifs}</div>
          </div>
          <div className="rounded-xl border border-xa-border bg-xa-surface p-4">
            <div className="text-xs text-xa-muted mb-1">Valeur écart net</div>
            <div className={`text-xl font-bold ${inventaire.valeur_ecart_total < 0 ? 'text-xa-danger' : inventaire.valeur_ecart_total > 0 ? 'text-powder-petal-400' : 'text-aquamarine-500'}`}>
              {inventaire.valeur_ecart_total >= 0 ? '+' : ''}{formatFCFA(inventaire.valeur_ecart_total)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xa-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-ink text-sm focus:outline-none focus:ring-1 focus:ring-xa-primary placeholder:text-xa-muted/60"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { key: 'tous', label: 'Tous' },
            { key: 'comptes', label: 'Comptés' },
            { key: 'non_comptes', label: 'Non comptés' },
            { key: 'avec_ecart', label: 'Avec écart' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-xa-primary text-white'
                  : 'bg-xa-bg border border-xa-border text-xa-muted hover:text-xa-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-xa-border bg-xa-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-xa-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Produit</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Catégorie</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Théorique</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider w-36">Compté</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-xa-muted uppercase tracking-wider">Écart</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xa-muted text-sm">
                    Aucun produit correspondant
                  </td>
                </tr>
              ) : (
                filtered.map((ligne) => (
                  <LigneRow
                    key={ligne.id}
                    ligne={ligne}
                    isReadOnly={isReadOnly}
                    onChange={handleStockChange}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validate Modal */}
      {showValidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-xa-surface border border-xa-border shadow-2xl">
            <div className="px-6 py-4 border-b border-xa-border">
              <h2 className="text-base font-semibold text-xa-ink" style={{ fontFamily: 'var(--font-familjen), sans-serif' }}>
                Confirmer la validation
              </h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-xa-muted">
                Les stocks seront mis à jour immédiatement selon les valeurs comptées. Cette action est irréversible.
              </p>
              <div className="rounded-lg bg-xa-bg border border-xa-border p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-xa-muted">Produits</span>
                  <span className="font-medium text-xa-ink">{nbTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xa-muted">Écarts</span>
                  <span className="font-medium text-xa-ink">{nbEcarts}</span>
                </div>
                {perteTotal !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-xa-muted">Perte</span>
                    <span className="font-medium text-xa-danger">{formatFCFA(perteTotal)}</span>
                  </div>
                )}
                {surplusTotal !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-xa-muted">Surplus</span>
                    <span className="font-medium text-powder-petal-400">+{formatFCFA(surplusTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-xa-border pt-2 mt-2">
                  <span className="text-xa-muted font-medium">NET</span>
                  <span className={`font-bold ${ecartTotal < 0 ? 'text-xa-danger' : ecartTotal > 0 ? 'text-powder-petal-400' : 'text-aquamarine-500'}`}>
                    {ecartTotal >= 0 ? '+' : ''}{formatFCFA(ecartTotal)}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button
                onClick={() => setShowValidateModal(false)}
                disabled={validating}
                className="flex-1 px-4 py-2 rounded-xl border border-xa-border text-xa-muted text-sm font-medium hover:text-xa-ink hover:border-xa-ink/30 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleValidate}
                disabled={validating}
                className="flex-1 px-4 py-2 rounded-xl bg-aquamarine-500 text-white text-sm font-semibold hover:bg-aquamarine-600 transition-colors disabled:opacity-50"
              >
                {validating ? 'Validation…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component to avoid re-rendering all rows on each keystroke
function LigneRow({
  ligne,
  isReadOnly,
  onChange,
}: {
  ligne: LigneAvecProduit;
  isReadOnly: boolean;
  onChange: (ligne: LigneAvecProduit, value: string) => void;
}) {
  const isDecimal = ['kg', 'L', 'litre', 'litres', 'kilogramme', 'kilogrammes'].some((u) =>
    ligne.produit.unite.toLowerCase().includes(u.toLowerCase()),
  );
  const isCompte = ligne.stock_compte !== null;

  return (
    <tr className={`border-b border-xa-border last:border-0 transition-colors ${isCompte ? 'hover:bg-xa-bg/50' : 'hover:bg-xa-bg'}`}>
      <td className="px-5 py-3">
        <div className="font-medium text-xa-ink">{ligne.produit.nom}</div>
        <div className="text-xs text-xa-muted">{ligne.produit.unite}</div>
      </td>
      <td className="px-5 py-3 text-xa-muted text-xs">{ligne.produit.categorie}</td>
      <td className="px-5 py-3 text-right font-medium text-xa-ink">{ligne.stock_theorique}</td>
      <td className="px-5 py-3 text-right">
        {isReadOnly ? (
          <span className="text-xa-ink font-medium">{ligne.stock_compte ?? '—'}</span>
        ) : (
          <input
            type="number"
            inputMode="decimal"
            step={isDecimal ? '0.001' : '1'}
            min="0"
            defaultValue={ligne.stock_compte !== null ? String(ligne.stock_compte) : ''}
            placeholder="—"
            onChange={(e) => onChange(ligne, e.target.value)}
            className="w-24 px-2 py-1 rounded-lg border border-xa-border bg-xa-bg text-xa-ink text-sm text-right focus:outline-none focus:ring-1 focus:ring-xa-primary placeholder:text-xa-muted/60"
          />
        )}
      </td>
      <td className="px-5 py-3 text-right">
        <EcartCell
          ecart={ligne.stock_compte !== null ? ligne.ecart : null}
        />
      </td>
    </tr>
  );
}
