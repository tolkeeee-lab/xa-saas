'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase-browser';
import type { Produit } from '../../../types/database';

export const dynamic = 'force-dynamic';

function ProduitsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const boutiqueId = params.get('boutique_id') ?? '';

  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState('');
  const [stock, setStock] = useState('0');
  const [unite, setUnite] = useState('unité');
  const [stockMin, setStockMin] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editPrix, setEditPrix] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadProduits = useCallback(async () => {
    if (!boutiqueId) return;
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('produits')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .eq('actif', true)
      .order('nom');
    if (err) setError(err.message);
    else setProduits(data ?? []);
    setLoading(false);
  }, [boutiqueId]);

  useEffect(() => {
    if (!boutiqueId) { router.replace('/dashboard'); return; }
    void loadProduits();
  }, [boutiqueId, router, loadProduits]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const prixNum = parseFloat(prix);
    if (!nom.trim()) { setFormError('Le nom est requis'); return; }
    if (isNaN(prixNum) || prixNum < 0) { setFormError('Prix invalide'); return; }

    setSubmitting(true);
    const supabase = createClient();
    const { error: err } = await supabase.from('produits').insert({
      boutique_id: boutiqueId,
      nom: nom.trim(),
      prix_unitaire: prixNum,
      stock_actuel: parseInt(stock) || 0,
      stock_minimum: parseInt(stockMin) || 0,
      unite: unite.trim() || 'unité',
      actif: true,
    });
    setSubmitting(false);
    if (err) { setFormError(err.message); return; }
    setNom(''); setPrix(''); setStock('0'); setStockMin('0'); setUnite('unité');
    await loadProduits();
  };

  const startEdit = (p: Produit) => {
    setEditId(p.id);
    setEditNom(p.nom);
    setEditPrix(String(p.prix_unitaire));
    setEditStock(String(p.stock_actuel));
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setEditSubmitting(true);
    const supabase = createClient();
    await supabase.from('produits').update({
      nom: editNom.trim(),
      prix_unitaire: parseFloat(editPrix) || 0,
      stock_actuel: parseInt(editStock) || 0,
    }).eq('id', editId);
    setEditSubmitting(false);
    setEditId(null);
    await loadProduits();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('produits').update({ actif: false }).eq('id', id);
    await loadProduits();
  };

  return (
    <main className="min-h-screen bg-xa-bg p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-xa-primary">Produits</h1>
          <Link href="/dashboard" className="text-sm text-gray-400">← Retour</Link>
        </div>

        {loading && <p className="text-gray-400 text-sm text-center">Chargement...</p>}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {!loading && (
          <div className="space-y-3 mb-8">
            {produits.length === 0 && (
              <p className="text-gray-400 text-sm text-center">Aucun produit pour l&apos;instant</p>
            )}
            {produits.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow p-4">
                {editId === p.id ? (
                  <form onSubmit={handleEdit} className="space-y-2">
                    <input type="text" value={editNom} onChange={e => setEditNom(e.target.value)} required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={editPrix} onChange={e => setEditPrix(e.target.value)} placeholder="Prix"
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" />
                      <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} placeholder="Stock"
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={editSubmitting}
                        className="flex-1 bg-xa-primary text-white text-sm rounded-xl py-2 disabled:opacity-50">
                        {editSubmitting ? '...' : 'Enregistrer'}
                      </button>
                      <button type="button" onClick={() => setEditId(null)}
                        className="flex-1 border border-gray-200 text-gray-500 text-sm rounded-xl py-2">
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{p.nom}</p>
                      <p className="text-sm text-xa-primary font-bold">{p.prix_unitaire.toLocaleString('fr-FR')} F</p>
                      <p className="text-xs text-gray-400">
                        Stock : {p.stock_actuel} {p.unite}
                        {p.stock_actuel <= p.stock_minimum && (
                          <span className="ml-1 text-orange-500">⚠ stock bas</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(p)}
                        className="text-xs text-xa-primary border border-xa-primary/30 rounded-lg px-2 py-1">
                        Modifier
                      </button>
                      <button onClick={() => void handleDelete(p.id)}
                        className="text-xs text-red-400 hover:text-red-600">
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Ajouter un produit</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Nom du produit" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA) *</label>
                <input type="number" inputMode="numeric" value={prix} onChange={e => setPrix(e.target.value)} required min="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                <input type="text" value={unite} onChange={e => setUnite(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                  placeholder="unité, kg, L…" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock actuel</label>
                <input type="number" inputMode="numeric" value={stock} onChange={e => setStock(e.target.value)} min="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock minimum</label>
                <input type="number" inputMode="numeric" value={stockMin} onChange={e => setStockMin(e.target.value)} min="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" />
              </div>
            </div>
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <button type="submit" disabled={submitting}
              className="w-full bg-xa-primary text-white font-semibold rounded-xl py-2.5 hover:bg-xa-primary/90 transition disabled:opacity-50">
              {submitting ? 'Ajout...' : 'Ajouter le produit'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ProduitsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-xa-bg flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </main>
    }>
      <ProduitsPageInner />
    </Suspense>
  );
}
