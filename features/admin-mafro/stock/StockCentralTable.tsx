'use client';

import { useState, useCallback } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import type { ProduitCatalogueAdmin } from '@/types/database';
import RestockAlertes from './RestockAlertes';

type Props = {
  initialProduits: ProduitCatalogueAdmin[];
};

export default function StockCentralTable({ initialProduits }: Props) {
  const [search, setSearch] = useState('');
  const [filterRuptures, setFilterRuptures] = useState(false);
  const [produits, setProduits] = useState(initialProduits);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const showToast = useCallback((msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleSaveStock = useCallback(
    async (produitId: string) => {
      setLoadingId(produitId);
      try {
        const res = await fetch(`/api/admin-mafro/stock/${produitId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_central: editStock }),
        });
        if (!res.ok) throw new Error('Erreur serveur');
        setProduits((prev) =>
          prev.map((p) =>
            p.id === produitId ? { ...p, stock_central: editStock } : p,
          ),
        );
        setEditingId(null);
        showToast('Stock mis à jour', 'ok');
      } catch {
        showToast('Erreur lors de la mise à jour', 'err');
      } finally {
        setLoadingId(null);
      }
    },
    [editStock, showToast],
  );

  const filtered = produits.filter((p) => {
    const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase());
    const matchRuptures = filterRuptures ? p.stock_central <= 0 : true;
    return matchSearch && matchRuptures;
  });

  const rupturesCount = produits.filter((p) => p.est_actif && p.stock_central <= 0).length;

  return (
    <div className="xa-stock-central">
      {toast && <div className={`xa-toast xa-toast--${toast.type}`}>{toast.msg}</div>}

      {rupturesCount > 0 && (
        <RestockAlertes
          produits={produits.filter((p) => p.est_actif && p.stock_central <= 0)}
        />
      )}

      {/* Toolbar */}
      <div className="xa-stock-central__toolbar">
        <div className="xa-search-wrap">
          <Search size={16} />
          <input
            className="xa-input xa-input--search"
            type="text"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`xa-btn xa-btn--sm${filterRuptures ? ' xa-btn--red' : ' xa-btn--ghost'}`}
          onClick={() => setFilterRuptures((v) => !v)}
        >
          <AlertTriangle size={14} />
          {filterRuptures ? 'Toutes' : 'Ruptures seules'}
        </button>
      </div>

      <div className="xa-table-wrap">
        <table className="xa-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Unité</th>
              <th>Prix B2B</th>
              <th>Stock central</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--xa-muted)' }}>
                  Aucun produit
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.emoji} {p.nom}
                </td>
                <td>{p.categorie ?? '—'}</td>
                <td>{p.unite ?? '—'}</td>
                <td>{p.prix_b2b.toLocaleString('fr-FR')} FCFA</td>
                <td>
                  {editingId === p.id ? (
                    <input
                      className="xa-input xa-input--sm"
                      type="number"
                      min={0}
                      value={editStock}
                      onChange={(e) => setEditStock(Number(e.target.value))}
                      style={{ width: 80 }}
                    />
                  ) : (
                    <span className={p.stock_central <= 0 ? 'xa-text--danger' : ''}>
                      {p.stock_central}
                    </span>
                  )}
                </td>
                <td>
                  <span className={`xa-badge xa-badge--${p.est_actif ? 'green' : 'red'}`}>
                    {p.est_actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  {editingId === p.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="xa-btn xa-btn--sm xa-btn--green"
                        onClick={() => handleSaveStock(p.id)}
                        disabled={loadingId === p.id}
                      >
                        Sauv.
                      </button>
                      <button
                        className="xa-btn xa-btn--sm xa-btn--ghost"
                        onClick={() => setEditingId(null)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      className="xa-btn xa-btn--sm xa-btn--ghost"
                      onClick={() => { setEditingId(p.id); setEditStock(p.stock_central); }}
                    >
                      Modifier
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
