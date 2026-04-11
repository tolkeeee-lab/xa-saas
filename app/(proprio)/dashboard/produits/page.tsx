'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { formatPrice } from '@/lib/format';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { Produit } from '@/types/database';

export default function ProduitsPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', prix_achat: '', prix_vente: '', stock_actuel: '', stock_minimum: '5', unite: 'unité' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: boutique } = await supabase.from('boutiques').select('id').eq('proprietaire_id', user.id).eq('actif', true).single();
      if (!boutique) { setLoading(false); return; }
      setBoutiqueId(boutique.id);
      const { data } = await supabase.from('produits').select('*').eq('boutique_id', boutique.id).eq('actif', true).order('nom');
      setProduits(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!boutiqueId) return;
    setSaving(true); setError('');
    const supabase = createClient();
    const { error: dbErr, data } = await supabase.from('produits').insert({
      boutique_id: boutiqueId,
      nom: form.nom,
      prix_achat: Number(form.prix_achat),
      prix_vente: Number(form.prix_vente),
      stock_actuel: Number(form.stock_actuel),
      stock_minimum: Number(form.stock_minimum),
      unite: form.unite,
      actif: true,
    }).select().single();
    if (dbErr) { setError(dbErr.message); } else if (data) {
      setProduits(prev => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)));
      setShowForm(false);
      setForm({ nom: '', prix_achat: '', prix_vente: '', stock_actuel: '', stock_minimum: '5', unite: 'unité' });
    }
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-xa-bg px-4 py-6 max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-xa-primary text-xl">←</a>
          <h1 className="text-lg font-bold text-xa-primary">Produits & Stock</h1>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)}>+ Ajouter</Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="text-xa-danger text-sm">{error}</div>}
            {[
              { name: 'nom', label: 'Nom', type: 'text', required: true },
              { name: 'prix_achat', label: "Prix d'achat (F)", type: 'number', required: true },
              { name: 'prix_vente', label: 'Prix de vente (F)', type: 'number', required: true },
              { name: 'stock_actuel', label: 'Stock actuel', type: 'number', required: true },
              { name: 'stock_minimum', label: 'Stock minimum', type: 'number', required: false },
              { name: 'unite', label: 'Unité', type: 'text', required: false },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  required={field.required}
                  value={form[field.name as keyof typeof form]}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1" loading={saving}>Enregistrer</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-8">Chargement…</p>
      ) : produits.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Aucun produit. Ajoutez-en un !</p>
      ) : (
        <div className="space-y-2">
          {produits.map(p => (
            <Card key={p.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-gray-900">{p.nom}</p>
                <p className="text-xs text-gray-500">Stock : {p.stock_actuel} {p.unite}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-xa-primary">{formatPrice(p.prix_vente)}</p>
                {p.stock_actuel <= p.stock_minimum && (
                  <span className="text-xs text-xa-danger font-medium">⚠ Stock bas</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
