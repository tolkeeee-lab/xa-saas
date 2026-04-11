'use client';

import { useState } from 'react';
import { formatFCFA } from '@/lib/format';
import { hashPin } from '@/lib/pinHash';
import { createClient } from '@/lib/supabase-browser';
import type { EmployePersonnel } from '@/lib/supabase/getPersonnel';
import type { Boutique } from '@/types/database';

type PersonnelTableProps = {
  employes: EmployePersonnel[];
  boutiques: Boutique[];
};

type ToastState = { message: string; type: 'success' | 'error' } | null;

const EMPTY_FORM = {
  boutique_id: '',
  nom: '',
  prenom: '',
  telephone: '',
  role: 'caissier' as 'caissier' | 'gerant',
  pin: '',
};

export default function PersonnelTable({
  employes: initialEmployes,
  boutiques,
}: PersonnelTableProps) {
  const [employes, setEmployes] = useState<EmployePersonnel[]>(initialEmployes);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const total = employes.length;
  const presents = employes.filter((e) => e.actif).length;
  const absents = total - presents;

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleAddEmploye(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!form.boutique_id) {
      setFormError('Sélectionnez une boutique.');
      return;
    }
    if (!form.nom.trim()) {
      setFormError('Le nom est obligatoire.');
      return;
    }
    if (!form.prenom.trim()) {
      setFormError('Le prénom est obligatoire.');
      return;
    }
    if (!/^\d{4}$/.test(form.pin)) {
      setFormError('Le PIN doit contenir exactement 4 chiffres.');
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) { setFormError('Non authentifié.'); setSubmitting(false); return; }

    const pinHash = await hashPin(form.pin);

    const { data: newEmp, error } = await supabase
      .from('employes')
      .insert({
        boutique_id: form.boutique_id,
        proprietaire_id: user.id,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: form.telephone.trim() || null,
        role: form.role,
        pin: pinHash,
        actif: true,
      })
      .select('*')
      .single();

    setSubmitting(false);

    if (error || !newEmp) {
      setFormError(error?.message ?? 'Erreur lors de l\'ajout.');
      return;
    }

    const boutique = boutiques.find((b) => b.id === newEmp.boutique_id);
    const enriched: EmployePersonnel = {
      ...newEmp,
      boutique_nom: boutique?.nom ?? '',
      boutique_couleur: boutique?.couleur_theme ?? '#999',
      ca_mois: 0,
    };

    setEmployes((prev) => [...prev, enriched]);
    setShowModal(false);
    setForm(EMPTY_FORM);
    showToast('Employé ajouté avec succès.', 'success');
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-xa-text">Personnel avancé</h1>
          <p className="text-sm text-xa-muted mt-0.5">Équipes de votre réseau</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Total employés
          </p>
          <p className="text-2xl font-bold text-xa-text">{total}</p>
        </div>
        <div className="bg-green-100 dark:bg-green-900/20 border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Présents aujourd&apos;hui
          </p>
          <p className="text-2xl font-bold text-green-600">{presents}</p>
        </div>
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Absents
          </p>
          <p className="text-2xl font-bold text-xa-muted">{absents}</p>
        </div>
      </div>

      {/* Table */}
      {employes.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-xa-muted">Aucun employé dans votre réseau.</p>
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  {['Employé', 'Boutique', 'Poste', 'Présence', 'CA généré (mois)', 'Action'].map(
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
                {employes.map((emp) => {
                  const initials =
                    `${emp.prenom.charAt(0)}${emp.nom.charAt(0)}`.toUpperCase();
                  return (
                    <tr
                      key={emp.id}
                      className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                            style={{ backgroundColor: emp.boutique_couleur }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-xa-text">
                              {emp.prenom} {emp.nom}
                            </p>
                            {emp.telephone && (
                              <p className="text-xs text-xa-muted">{emp.telephone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xa-text">{emp.boutique_nom}</td>
                      <td className="px-4 py-3 capitalize text-xa-text">{emp.role}</td>
                      <td className="px-4 py-3">
                        {emp.actif ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20">
                            Présent
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-xa-border text-xa-muted">
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-xa-text">
                        {formatFCFA(emp.ca_mois)}
                      </td>
                      <td className="px-4 py-3">
                        <button className="px-3 py-1.5 rounded-lg border border-xa-border text-xa-text text-xs font-medium hover:bg-xa-bg transition-colors">
                          Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add employee modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-xa-surface border border-xa-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-xa-border">
              <h2 className="font-semibold text-xa-text">Nouvel employé</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-xa-muted hover:text-xa-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddEmploye} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Boutique <span className="text-xa-danger">*</span>
                </label>
                <select
                  value={form.boutique_id}
                  onChange={(e) => setForm((f) => ({ ...f, boutique_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                >
                  <option value="">— Sélectionner —</option>
                  {boutiques.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-xa-text mb-1">
                    Nom <span className="text-xa-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-xa-text mb-1">
                    Prénom <span className="text-xa-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                  placeholder="+229 …"
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as 'caissier' | 'gerant',
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                >
                  <option value="caissier">Caissier</option>
                  <option value="gerant">Gérant</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  PIN caisse (4 chiffres) <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.pin}
                  onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
                <p className="text-xs text-xa-muted mt-1">Haché SHA-256 avant stockage.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm font-medium hover:bg-xa-bg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? 'Ajout…' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
