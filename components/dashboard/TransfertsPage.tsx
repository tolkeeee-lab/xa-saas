'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/format';
import type { Boutique, Produit, Transfert } from '@/types/database';

type TransfertsPageProps = {
  boutiques: Boutique[];
  produits: (Omit<Produit, 'prix_achat'>)[];
  transferts: Transfert[];
};

type ToastState = { message: string; type: 'success' | 'error' } | null;

const EMPTY_FORM = {
  produit_id: '',
  boutique_source_id: '',
  boutique_destination_id: '',
  quantite: '',
  note: '',
};

export default function TransfertsPage({
  boutiques,
  produits,
  transferts: initialTransferts,
}: TransfertsPageProps) {
  const [transferts, setTransferts] = useState<Transfert[]>(initialTransferts);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const enTransit = transferts.filter((t) => t.statut === 'en_transit').length;
  const ceMois = transferts.filter(
    (t) => new Date(t.created_at) >= startOfMonth,
  ).length;

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!form.produit_id) {
      setFormError('Sélectionnez un produit.');
      return;
    }
    if (!form.boutique_source_id) {
      setFormError('Sélectionnez la boutique source.');
      return;
    }
    if (!form.boutique_destination_id) {
      setFormError('Sélectionnez la boutique destination.');
      return;
    }
    if (form.boutique_source_id === form.boutique_destination_id) {
      setFormError('La source et la destination doivent être différentes.');
      return;
    }
    const qty = parseInt(form.quantite, 10);
    if (!qty || qty <= 0) {
      setFormError('Quantité invalide.');
      return;
    }

    setSubmitting(true);

    const res = await fetch('/api/transferts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produit_id: form.produit_id,
        boutique_source_id: form.boutique_source_id,
        boutique_destination_id: form.boutique_destination_id,
        quantite: qty,
        note: form.note || undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json();
      setFormError(err.error ?? 'Erreur lors du transfert.');
      return;
    }

    const newTransfert: Transfert = await res.json();
    setTransferts((prev) => [newTransfert, ...prev]);
    setForm(EMPTY_FORM);
    showToast('Transfert créé avec succès.', 'success');
  }

  function getBoutiqueName(id: string | null) {
    return boutiques.find((b) => b.id === id)?.nom ?? id ?? '—';
  }

  function getProduitName(id: string | null) {
    return produits.find((p) => p.id === id)?.nom ?? id ?? '—';
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
        <h1 className="text-xl font-bold text-xa-text">Transferts inter-sites</h1>
        <p className="text-sm text-xa-muted mt-0.5">
          Déplacer des stocks entre vos boutiques
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="En transit"
          value={String(enTransit)}
          color="text-orange-500"
          bg="bg-orange-100 dark:bg-orange-900/20"
        />
        <StatCard
          label="Ce mois"
          value={String(ceMois)}
          color="text-xa-primary"
          bg="bg-xa-primary/10"
        />
        <StatCard
          label="Total transferts"
          value={String(transferts.length)}
          color="text-xa-text"
          bg="bg-xa-surface"
        />
      </div>

      {/* Grid: table + form */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Historique */}
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-xa-border">
            <h2 className="font-semibold text-xa-text text-sm">Historique des transferts</h2>
          </div>
          {transferts.length === 0 ? (
            <p className="text-xa-muted text-sm p-6 text-center">Aucun transfert enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-xa-border bg-xa-bg">
                    {['Date', 'Produit', 'De', 'Vers', 'Qté', 'Statut'].map((h) => (
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
                  {transferts.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors"
                    >
                      <td className="px-4 py-2.5 text-xa-muted whitespace-nowrap">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-xa-text">
                        {getProduitName(t.produit_id)}
                      </td>
                      <td className="px-4 py-2.5 text-xa-text">
                        {getBoutiqueName(t.boutique_source_id)}
                      </td>
                      <td className="px-4 py-2.5 text-xa-text">
                        {getBoutiqueName(t.boutique_destination_id)}
                      </td>
                      <td className="px-4 py-2.5 text-xa-text">{t.quantite}</td>
                      <td className="px-4 py-2.5">
                        {t.statut === 'livre' ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            Livré
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                            En transit
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div className="bg-xa-surface border border-xa-border rounded-xl">
          <div className="px-4 py-3 border-b border-xa-border">
            <h2 className="font-semibold text-xa-text text-sm">Nouveau transfert</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {formError && (
              <div className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">
                Produit <span className="text-xa-danger">*</span>
              </label>
              <select
                value={form.produit_id}
                onChange={(e) => setForm((f) => ({ ...f, produit_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              >
                <option value="">— Sélectionner —</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} ({getBoutiqueName(p.boutique_id)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">
                Source <span className="text-xa-danger">*</span>
              </label>
              <select
                value={form.boutique_source_id}
                onChange={(e) => setForm((f) => ({ ...f, boutique_source_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              >
                <option value="">— Boutique source —</option>
                {boutiques.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">
                Destination <span className="text-xa-danger">*</span>
              </label>
              <select
                value={form.boutique_destination_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, boutique_destination_id: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              >
                <option value="">— Boutique destination —</option>
                {boutiques.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">
                Quantité <span className="text-xa-danger">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.quantite}
                onChange={(e) => setForm((f) => ({ ...f, quantite: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">Note</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder="Optionnel…"
                className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Création…' : 'Créer le transfert'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} border border-xa-border rounded-xl p-4`}>
      <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
