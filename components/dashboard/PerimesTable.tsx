'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/format';
import type { ProduitPeremption } from '@/lib/supabase/getPeremptions';

type PerimesTableProps = {
  produits: ProduitPeremption[];
};

type ToastState = { message: string; type: 'success' | 'error' } | null;

function getStatusBadge(jours: number) {
  if (jours < 0) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-xa-danger dark:bg-red-900/20">
        Expiré ({Math.abs(jours)}j)
      </span>
    );
  }
  if (jours <= 7) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
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
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20">
      {jours} jours
    </span>
  );
}

export default function PerimesTable({ produits: initialProduits }: PerimesTableProps) {
  const [produits, setProduits] = useState<ProduitPeremption[]>(initialProduits);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<ToastState>(null);

  const expires = produits.filter((p) => p.jours_restants < 0).length;
  const expiresSoon7 = produits.filter(
    (p) => p.jours_restants >= 0 && p.jours_restants <= 7,
  ).length;
  const expiresSoon30 = produits.filter(
    (p) => p.jours_restants > 7 && p.jours_restants <= 30,
  ).length;

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

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-xa-danger'
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
        <div className="bg-red-100 dark:bg-red-900/20 border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Expirés
          </p>
          <p className="text-2xl font-bold text-xa-danger">{expires}</p>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/20 border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Expirent &lt; 7 jours
          </p>
          <p className="text-2xl font-bold text-orange-500">{expiresSoon7}</p>
        </div>
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Expirent &lt; 30 jours
          </p>
          <p className="text-2xl font-bold text-xa-text">{expiresSoon30}</p>
        </div>
      </div>

      {/* Table */}
      {produits.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-xa-muted">Aucun produit avec date de péremption.</p>
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  {['Produit', 'Boutique', 'Stock', 'Date expiration', 'Jours restants', 'Statut', 'Action'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {produits.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors"
                  >
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
                          className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 whitespace-nowrap"
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
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
