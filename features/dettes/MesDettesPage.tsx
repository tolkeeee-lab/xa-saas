'use client';

import { useState } from 'react';
import { formatFCFA } from '@/lib/format';
import type { DettesProprioData } from '@/lib/supabase/getDettesProprioData';
import type { DetteProprio } from '@/types/database';

type MesDettesPageProps = {
  data: DettesProprioData;
};

type ToastState = { message: string; type: 'success' | 'error' } | null;

const STATUT_LABELS: Record<DetteProprio['statut'], string> = {
  en_cours: 'En cours',
  rembourse: 'Remboursé',
  en_retard: 'En retard',
};

const STATUT_COLORS: Record<DetteProprio['statut'], string> = {
  en_cours: 'bg-powder-petal-500/20 text-powder-petal-400',
  rembourse: 'bg-aquamarine-500/20 text-aquamarine-500',
  en_retard: 'bg-xa-danger/20 text-xa-danger',
};

const EMPTY_FORM = {
  libelle: '',
  creancier: '',
  montant: '',
  montant_rembourse: '0',
  date_echeance: '',
  notes: '',
};

export default function MesDettesPage({ data: initialData }: MesDettesPageProps) {
  const [dettes, setDettes] = useState<DetteProprio[]>(initialData.dettes);
  const [totals, setTotals] = useState({
    total_en_cours: initialData.total_en_cours,
    total_rembourse: initialData.total_rembourse,
    nb_en_retard: initialData.nb_en_retard,
  });
  const [toast, setToast] = useState<ToastState>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Remboursement partiel modal
  const [showRembModal, setShowRembModal] = useState(false);
  const [rembDette, setRembDette] = useState<DetteProprio | null>(null);
  const [rembMontant, setRembMontant] = useState('');
  const [rembError, setRembError] = useState<string | null>(null);
  const [rembSubmitting, setRembSubmitting] = useState(false);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function recalcTotals(updatedDettes: DetteProprio[]) {
    const total_en_cours = updatedDettes
      .filter((d) => d.statut === 'en_cours' || d.statut === 'en_retard')
      .reduce((s, d) => s + (d.montant - d.montant_rembourse), 0);
    const total_rembourse = updatedDettes.reduce((s, d) => s + d.montant_rembourse, 0);
    const nb_en_retard = updatedDettes.filter((d) => d.statut === 'en_retard').length;
    setTotals({ total_en_cours, total_rembourse, nb_en_retard });
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const montant = parseFloat(form.montant);
    const montant_rembourse = parseFloat(form.montant_rembourse || '0');

    if (!form.libelle.trim()) {
      setFormError('Le libellé est requis.');
      return;
    }
    if (!form.creancier.trim()) {
      setFormError('Le créancier est requis.');
      return;
    }
    if (isNaN(montant) || montant < 0) {
      setFormError('Montant invalide.');
      return;
    }
    if (isNaN(montant_rembourse) || montant_rembourse < 0) {
      setFormError('Montant remboursé invalide.');
      return;
    }

    setSubmitting(true);

    const body = {
      libelle: form.libelle.trim(),
      creancier: form.creancier.trim(),
      montant,
      montant_rembourse,
      date_echeance: form.date_echeance || null,
      notes: form.notes.trim() || null,
    };

    const res = await fetch('/api/dettes-proprio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json() as { error?: string };
      setFormError(err.error ?? 'Erreur lors de la création.');
      return;
    }

    const saved = await res.json() as DetteProprio;
    const updatedDettes = [saved, ...dettes];
    setDettes(updatedDettes);
    recalcTotals(updatedDettes);
    showToast('Dette ajoutée.', 'success');
    setShowModal(false);
  }

  async function handleMarkRembourse(id: string) {
    const res = await fetch(`/api/dettes-proprio/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'rembourse' }),
    });

    if (res.ok) {
      const updated = await res.json() as DetteProprio;
      const updatedDettes = dettes.map((d) => (d.id === id ? updated : d));
      setDettes(updatedDettes);
      recalcTotals(updatedDettes);
      showToast('Dette marquée remboursée.', 'success');
    } else {
      const err = await res.json() as { error?: string };
      showToast(err.error ?? 'Erreur.', 'error');
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/dettes-proprio/${id}`, { method: 'DELETE' });
    setDeletingId(null);

    if (res.ok) {
      const updatedDettes = dettes.filter((d) => d.id !== id);
      setDettes(updatedDettes);
      recalcTotals(updatedDettes);
      showToast('Dette supprimée.', 'success');
    } else {
      const err = await res.json() as { error?: string };
      showToast(err.error ?? 'Erreur lors de la suppression.', 'error');
    }
  }

  function openRemboursement(d: DetteProprio) {
    setRembDette(d);
    setRembMontant('');
    setRembError(null);
    setShowRembModal(true);
  }

  async function handleRembSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rembDette) return;
    setRembError(null);

    const montantCeJour = parseFloat(rembMontant);
    if (isNaN(montantCeJour) || montantCeJour <= 0) {
      setRembError('Montant invalide.');
      return;
    }

    const newMontantRembourse = rembDette.montant_rembourse + montantCeJour;

    setRembSubmitting(true);

    const res = await fetch(`/api/dettes-proprio/${rembDette.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ montant_rembourse: newMontantRembourse }),
    });

    setRembSubmitting(false);

    if (res.ok) {
      const updated = await res.json() as DetteProprio;
      const updatedDettes = dettes.map((d) => (d.id === rembDette.id ? updated : d));
      setDettes(updatedDettes);
      recalcTotals(updatedDettes);
      showToast('Remboursement enregistré.', 'success');
      setShowRembModal(false);
    } else {
      const err = await res.json() as { error?: string };
      setRembError(err.error ?? 'Erreur.');
    }
  }

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-xa-text">💳 Mes dettes personnelles</h1>
          <p className="text-sm text-xa-muted mt-0.5">
            Suivez vos emprunts et remboursements
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Nouvelle dette
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total dû"
          value={formatFCFA(totals.total_en_cours)}
          color="text-xa-danger"
          style={{ animation: 'xa-fade-up 0.4s ease both' }}
        />
        <StatCard
          label="Déjà remboursé"
          value={formatFCFA(totals.total_rembourse)}
          color="text-aquamarine-600"
          style={{ animation: 'xa-fade-up 0.4s ease both', animationDelay: '0.05s' }}
        />
        <StatCard
          label="Dettes en retard"
          value={String(totals.nb_en_retard)}
          color="text-powder-petal-500"
          style={{ animation: 'xa-fade-up 0.4s ease both', animationDelay: '0.1s' }}
        />
        <StatCard
          label="Dettes actives"
          value={String(dettes.length)}
          color="text-xa-text"
          style={{ animation: 'xa-fade-up 0.4s ease both', animationDelay: '0.15s' }}
        />
      </div>

      {/* Tableau */}
      {dettes.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-xa-muted">Aucune dette personnelle enregistrée.</p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Ajouter une dette
          </button>
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  {['Libellé', 'Créancier', 'Montant total', 'Remboursé', 'Reste dû', 'Échéance', 'Statut', 'Actions'].map(
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
                {dettes.map((d) => {
                  const resteDu = Math.max(0, d.montant - d.montant_rembourse);
                  return (
                    <tr
                      key={d.id}
                      className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-xa-text">{d.libelle}</td>
                      <td className="px-4 py-3 text-xa-muted">{d.creancier}</td>
                      <td className="px-4 py-3 text-xa-text font-semibold">{formatFCFA(d.montant)}</td>
                      <td className="px-4 py-3 text-aquamarine-600">{formatFCFA(d.montant_rembourse)}</td>
                      <td className="px-4 py-3 font-bold text-xa-danger">{formatFCFA(resteDu)}</td>
                      <td className="px-4 py-3 text-xa-muted">
                        {d.date_echeance
                          ? new Date(d.date_echeance).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUT_COLORS[d.statut]}`}>
                          {STATUT_LABELS[d.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {d.statut !== 'rembourse' && (
                            <>
                              <button
                                onClick={() => openRemboursement(d)}
                                className="px-2 py-1 rounded-lg border border-xa-border text-xa-text text-xs font-semibold hover:bg-xa-bg transition-colors whitespace-nowrap"
                              >
                                Rembourser
                              </button>
                              <button
                                onClick={() => handleMarkRembourse(d.id)}
                                className="px-2 py-1 rounded-lg bg-aquamarine-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                              >
                                Tout remboursé
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(d.id)}
                            disabled={deletingId === d.id}
                            className="px-2 py-1 rounded-lg bg-xa-danger text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                          >
                            {deletingId === d.id ? '…' : 'Supprimer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {totals.total_en_cours > 0 && (
                <tfoot>
                  <tr className="border-t border-xa-border bg-xa-bg">
                    <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider text-right">
                      Total dettes en cours
                    </td>
                    <td className="px-4 py-3 font-bold text-xa-danger">
                      {formatFCFA(totals.total_en_cours)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Modal nouvelle dette */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-xa-surface rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-xa-border flex items-center justify-between">
              <h3 className="font-semibold text-xa-text">Nouvelle dette</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-xa-muted hover:text-xa-text transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Libellé <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.libelle}
                  onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))}
                  placeholder="Ex: Prêt pour stock janvier"
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Créancier <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.creancier}
                  onChange={(e) => setForm((f) => ({ ...f, creancier: e.target.value }))}
                  placeholder="Ex: Famille Koffi, Banque BOA"
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Montant emprunté (FCFA) <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.montant}
                  onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Montant déjà remboursé (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.montant_rembourse}
                  onChange={(e) => setForm((f) => ({ ...f, montant_rembourse: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Date d&#39;échéance
                </label>
                <input
                  type="date"
                  value={form.date_echeance}
                  onChange={(e) => setForm((f) => ({ ...f, date_echeance: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Informations complémentaires…"
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm font-semibold hover:bg-xa-bg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? '…' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal remboursement partiel */}
      {showRembModal && rembDette && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRembModal(false);
          }}
        >
          <div className="bg-xa-surface rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-xa-border flex items-center justify-between">
              <h3 className="font-semibold text-xa-text">Remboursement partiel</h3>
              <button
                onClick={() => setShowRembModal(false)}
                className="text-xa-muted hover:text-xa-text transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="px-5 pt-4">
              <p className="text-sm text-xa-muted">
                Dette : <span className="font-semibold text-xa-text">{rembDette.libelle}</span>
              </p>
              <p className="text-sm text-xa-muted mt-1">
                Reste dû :{' '}
                <span className="font-bold text-xa-danger">
                  {formatFCFA(Math.max(0, rembDette.montant - rembDette.montant_rembourse))}
                </span>
              </p>
            </div>
            <form onSubmit={handleRembSubmit} className="p-5 space-y-4">
              {rembError && (
                <div className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">
                  {rembError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Montant remboursé ce jour (FCFA) <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={rembMontant}
                  onChange={(e) => setRembMontant(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRembModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm font-semibold hover:bg-xa-bg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={rembSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {rembSubmitting ? '…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  style,
}: {
  label: string;
  value: string;
  color: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="bg-xa-surface border border-xa-border rounded-xl p-3" style={style}>
      <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
