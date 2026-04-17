'use client';

import { useState } from 'react';
import { formatDate, formatFCFA } from '@/lib/format';
import type { ProduitPeremption } from '@/lib/supabase/getPeremptions';

type PerimesTableProps = {
  produits: ProduitPeremption[];
};

type FilterType = 'tous' | 'expires' | 'lt7' | 'lt30';
type ToastState = { message: string; type: 'success' | 'error' } | null;

function getStatusBadge(jours: number) {
  if (jours < 0) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cotton-rose-100 text-xa-danger dark:bg-cotton-rose-900/20">
        Expiré ({Math.abs(jours)}j)
      </span>
    );
  }
  if (jours <= 7) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-powder-petal-100 text-powder-petal-600 dark:bg-powder-petal-900/20">
        {jours} jour{jours !== 1 ? 's' : ''}
      </span>
    );
  }
  if (jours <= 30) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/20">
        {jours} jours
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-aquamarine-100 text-aquamarine-700 dark:bg-aquamarine-900/20">
      {jours} jours
    </span>
  );
}

export default function PerimesTable({ produits: initialProduits }: PerimesTableProps) {
  const [produits, setProduits] = useState<ProduitPeremption[]>(initialProduits);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<ToastState>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('tous');

  const expires = produits.filter((p) => p.jours_restants < 0).length;
  const expiresSoon7 = produits.filter(
    (p) => p.jours_restants >= 0 && p.jours_restants <= 7,
  ).length;
  const expiresSoon30 = produits.filter(
    (p) => p.jours_restants > 7 && p.jours_restants <= 30,
  ).length;

  const filteredProduits = produits.filter((p) => {
    if (filter === 'expires') return p.jours_restants < 0;
    if (filter === 'lt7') return p.jours_restants >= 0 && p.jours_restants <= 7;
    if (filter === 'lt30') return p.jours_restants <= 30;
    return true;
  });

  const totalValeurPerdue = filteredProduits.reduce(
    (sum, p) => sum + p.stock_actuel * p.prix_achat,
    0,
  );

  const allSelected =
    filteredProduits.length > 0 &&
    filteredProduits.every((p) => selected.has(p.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredProduits.map((p) => p.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleRetirer(id: string) {
    setLoading((l) => ({ ...l, [id]: true }));
    const res = await fetch(`/api/produits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_actuel: 0 }),
    });
    setLoading((l) => ({ ...l, [id]: false }));

    if (res.ok) {
      setProduits((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock_actuel: 0 } : p)),
      );
      showToast('Produit retiré du stock.', 'success');
    } else {
      const err = await res.json();
      showToast(err.error ?? 'Erreur lors du retrait.', 'error');
    }
  }

  async function handleRetirerBatch() {
    if (selected.size === 0) return;
    setBatchLoading(true);

    const ids = [...selected];
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/produits/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_actuel: 0 }),
        }),
      ),
    );

    setBatchLoading(false);

    const failed = results.filter((r) => !r.ok).length;
    const succeeded = results.length - failed;

    setProduits((prev) =>
      prev.map((p) => (selected.has(p.id) ? { ...p, stock_actuel: 0 } : p)),
    );
    setSelected(new Set());

    if (failed === 0) {
      showToast(`${succeeded} produit${succeeded > 1 ? 's' : ''} retiré${succeeded > 1 ? 's' : ''} du stock.`, 'success');
    } else {
      showToast(`${succeeded} retiré(s), ${failed} erreur(s).`, 'error');
    }
  }

  async function handlePromoFlash(id: string, prix_vente: number) {
    const newPrice = Math.round(prix_vente * 0.7);
    setLoading((l) => ({ ...l, [id]: true }));
    const res = await fetch(`/api/produits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prix_vente: newPrice }),
    });
    setLoading((l) => ({ ...l, [id]: false }));

    if (res.ok) {
      setProduits((prev) =>
        prev.map((p) => (p.id === id ? { ...p, prix_vente: newPrice } : p)),
      );
      showToast('Promo flash -30% appliquée.', 'success');
    } else {
      const err = await res.json();
      showToast(err.error ?? 'Erreur lors de la promotion.', 'error');
    }
  }

  const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
    { key: 'tous', label: 'Tous' },
    { key: 'expires', label: "Périmés aujourd'hui" },
    { key: 'lt7', label: '< 7 jours' },
    { key: 'lt30', label: '< 30 jours' },
  ];

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-aquamarine-600' : 'bg-xa-danger'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-xa-text">Péremptions</h1>
        <p className="text-sm text-xa-muted mt-0.5">
          Produits avec date d&apos;expiration enregistrée
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-cotton-rose-100 dark:bg-cotton-rose-900/20 border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Expirés
          </p>
          <p className="text-2xl font-bold text-xa-danger">{expires}</p>
        </div>
        <div className="bg-powder-petal-100 dark:bg-powder-petal-900/20 border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Expirent &lt; 7 jours
          </p>
          <p className="text-2xl font-bold text-powder-petal-500">{expiresSoon7}</p>
        </div>
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Expirent &lt; 30 jours
          </p>
          <p className="text-2xl font-bold text-xa-text">{expiresSoon30}</p>
        </div>
      </div>

      {/* Filters + batch actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setFilter(opt.key);
                setSelected(new Set());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === opt.key
                  ? 'bg-xa-primary text-white'
                  : 'bg-xa-surface border border-xa-border text-xa-text hover:bg-xa-bg'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleRetirerBatch}
            disabled={batchLoading}
            className="px-4 py-1.5 rounded-lg bg-xa-danger text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {batchLoading
              ? '…'
              : `Retirer du stock (${selected.size})`}
          </button>
        )}
      </div>

      {/* Table */}
      {filteredProduits.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-xa-muted">Aucun produit correspondant.</p>
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  <th className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  {[
                    'Produit',
                    'Boutique',
                    'Stock',
                    'Date expiration',
                    'Jours restants',
                    'Statut',
                    'Valeur perdue',
                    'Action',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProduits.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors ${
                      selected.has(p.id) ? 'bg-xa-primary/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-xa-text">{p.nom}</td>
                    <td className="px-4 py-3 text-xa-muted">{p.boutique_nom}</td>
                    <td className="px-4 py-3 text-xa-text">
                      {p.stock_actuel} {p.unite}
                    </td>
                    <td className="px-4 py-3 text-xa-muted whitespace-nowrap">
                      {p.date_peremption ? formatDate(p.date_peremption) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xa-text">{p.jours_restants}</td>
                    <td className="px-4 py-3">{getStatusBadge(p.jours_restants)}</td>
                    <td className="px-4 py-3 text-xa-text font-medium">
                      {formatFCFA(p.stock_actuel * p.prix_achat)}
                    </td>
                    <td className="px-4 py-3">
                      {p.jours_restants < 0 ? (
                        <button
                          onClick={() => handleRetirer(p.id)}
                          disabled={loading[p.id] || p.stock_actuel === 0}
                          className="px-3 py-1.5 rounded-lg bg-xa-danger text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                        >
                          {loading[p.id] ? '…' : 'Retirer'}
                        </button>
                      ) : p.jours_restants <= 30 ? (
                        <button
                          onClick={() => handlePromoFlash(p.id, p.prix_vente)}
                          disabled={loading[p.id]}
                          className="px-3 py-1.5 rounded-lg bg-powder-petal-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 whitespace-nowrap"
                        >
                          {loading[p.id] ? '…' : 'Promo flash -30%'}
                        </button>
                      ) : (
                        <span className="text-xa-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-xa-border bg-xa-bg">
                  <td colSpan={8} className="px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider text-right">
                    Total valeur perdue
                  </td>
                  <td className="px-4 py-3 font-bold text-xa-danger">
                    {formatFCFA(totalValeurPerdue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
