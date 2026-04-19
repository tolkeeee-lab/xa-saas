'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { hashPin } from '@/lib/pinHash';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PersonnelTable from '@/features/personnel/PersonnelTable';
import type { EmployePersonnel } from '@/lib/supabase/getPersonnel';
import type { Boutique } from '@/types/database';

type ViewMode = 'grille' | 'table';

const ROLES = ['caissier', 'gerant'] as const;

const EMPTY_FORM = {
  boutique_id: '',
  nom: '',
  prenom: '',
  telephone: '',
  role: 'caissier' as 'caissier' | 'gerant',
  pin: '',
};

function getInitialsColor(index: number): string {
  const colors = [
    '#1c5d7d',
    '#2e9bd1',
    '#f7cf08',
    '#ff9100',
    '#10b981',
    '#8b5cf6',
    '#ef4444',
    '#f59e0b',
  ];
  return colors[index % colors.length];
}

function EmployeCard({ employe, color }: { employe: EmployePersonnel; color: string }) {
  const initials = `${employe.prenom.charAt(0)}${employe.nom.charAt(0)}`.toUpperCase();
  return (
    <div className="bg-xa-surface border border-xa-border rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xa-text truncate">
            {employe.prenom} {employe.nom}
          </p>
          <p className="text-xs text-xa-muted capitalize">{employe.role}</p>
        </div>
        {employe.boutique_nom && (
          <span
            className="text-xs px-2 py-0.5 rounded-full text-white shrink-0"
            style={{ backgroundColor: employe.boutique_couleur }}
          >
            {employe.boutique_nom}
          </span>
        )}
      </div>

      {employe.telephone && (
        <p className="text-xs text-xa-muted">{employe.telephone}</p>
      )}

      <div className="flex items-center gap-1.5 pt-2 border-t border-xa-border">
        {employe.actif ? (
          <>
            <span className="w-2 h-2 rounded-full bg-aquamarine-500" />
            <span className="text-xs text-aquamarine-600 font-medium">Actif</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-xa-muted" />
            <span className="text-xs text-xa-muted">Inactif</span>
          </>
        )}
      </div>
    </div>
  );
}

type EquipeViewProps = {
  employes: EmployePersonnel[];
  boutiques: Boutique[];
};

export default function EquipeView({ employes: initialEmployes, boutiques }: EquipeViewProps) {
  const [view, setView] = useState<ViewMode>('grille');
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<string>('all');
  const [employes, setEmployes] = useState<EmployePersonnel[]>(initialEmployes);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<ReactNode>(null);
  const [reloading, setReloading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const supabase = createClient();

  // Restore view preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('xa-equipe-view');
    if (stored === 'grille' || stored === 'table') setView(stored);
  }, []);

  function switchView(v: ViewMode) {
    setView(v);
    localStorage.setItem('xa-equipe-view', v);
  }

  const reloadEmployes = useCallback(async () => {
    setReloading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setReloading(false); return; }

    const boutiqueIds = boutiques.map((b) => b.id);
    if (!boutiqueIds.length) { setReloading(false); return; }

    const { data: empData } = await supabase
      .from('employes')
      .select('id, boutique_id, proprietaire_id, nom, prenom, telephone, role, pin, actif, created_at, updated_at')
      .in('boutique_id', boutiqueIds)
      .order('nom', { ascending: true });

    const boutiqueMap = new Map(boutiques.map((b) => [b.id, b]));

    setEmployes(
      (empData ?? []).map((emp) => {
        const boutique = boutiqueMap.get(emp.boutique_id);
        return {
          ...emp,
          boutique_nom: boutique?.nom ?? '',
          boutique_couleur: boutique?.couleur_theme ?? '#999',
          ca_mois: 0,
        } as EmployePersonnel;
      }),
    );
    setReloading(false);
  }, [boutiques, supabase]);

  async function handleAddEmploye(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!form.boutique_id) { setFormError('Sélectionnez une boutique.'); return; }
    if (!form.nom.trim()) { setFormError('Le nom est obligatoire.'); return; }
    if (!form.prenom.trim()) { setFormError('Le prénom est obligatoire.'); return; }
    if (!/^\d{4}$/.test(form.pin)) { setFormError('Le PIN doit contenir exactement 4 chiffres numériques.'); return; }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) { setFormError('Non authentifié.'); setSubmitting(false); return; }

    const pinHash = await hashPin(form.pin);

    const { error } = await supabase.from('employes').insert({
      boutique_id: form.boutique_id,
      proprietaire_id: user.id,
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim() || null,
      role: form.role,
      pin: pinHash,
      actif: true,
    });

    setSubmitting(false);
    if (error) {
      console.error('[add-employe]', error);
      const isRls = /row-level security|violates policy/i.test(error.message);
      if (isRls) {
        setFormError(
          <span>
            ⚠ Table employés non configurée en base.
            <br />
            Exécutez la migration{' '}
            <code>20260419_create_employes.sql</code> dans Supabase SQL Editor, puis réessayez.{' '}
            <a href="/docs/migrations" className="underline">
              Voir les migrations
            </a>
          </span>,
        );
      } else {
        setFormError(error.message);
      }
      return;
    }

    setShowModal(false);
    setForm(EMPTY_FORM);
    await reloadEmployes();
    showToast('✅ Employé ajouté avec succès', 'success');
  }

  const filteredEmployes =
    selectedBoutiqueId === 'all'
      ? employes
      : employes.filter((e) => e.boutique_id === selectedBoutiqueId);

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          onClick={() => setToast(null)}
          className={`fixed bottom-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white cursor-pointer ${
            toast.type === 'success' ? 'bg-aquamarine-600' : 'bg-xa-danger'
          }`}
        >
          {toast.message}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-xa-text">Équipe</h1>
          <p className="text-sm text-xa-muted mt-0.5">Gestion de votre personnel</p>
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-xa-border overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => switchView('grille')}
            className={`px-3 py-1.5 transition-colors ${
              view === 'grille'
                ? 'bg-xa-primary text-white font-semibold'
                : 'text-xa-muted hover:bg-xa-bg'
            }`}
          >
            Grille
          </button>
          <button
            type="button"
            onClick={() => switchView('table')}
            className={`px-3 py-1.5 transition-colors border-l border-xa-border ${
              view === 'table'
                ? 'bg-xa-primary text-white font-semibold'
                : 'text-xa-muted hover:bg-xa-bg'
            }`}
          >
            Table
          </button>
        </div>

        {/* Add button */}
        <div title={boutiques.length === 0 ? 'Créez d\'abord une boutique pour ajouter un employé' : undefined}>
          <button
            onClick={() => {
              setShowModal(true);
              setFormError(null);
              setForm({
                ...EMPTY_FORM,
                boutique_id:
                  selectedBoutiqueId !== 'all'
                    ? selectedBoutiqueId
                    : boutiques.length === 1
                      ? boutiques[0].id
                      : '',
              });
            }}
            disabled={boutiques.length === 0}
            aria-label="Ajouter employé"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter employé
          </button>
        </div>
      </div>

      {/* Boutique filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedBoutiqueId('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
            selectedBoutiqueId === 'all'
              ? 'bg-xa-primary text-white border-xa-primary'
              : 'border-xa-border text-xa-muted hover:bg-xa-bg'
          }`}
        >
          Toutes
        </button>
        {boutiques.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelectedBoutiqueId(b.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
              selectedBoutiqueId === b.id
                ? 'text-white border-transparent'
                : 'border-xa-border text-xa-muted hover:bg-xa-bg'
            }`}
            style={
              selectedBoutiqueId === b.id
                ? { backgroundColor: b.couleur_theme ?? 'var(--xa-primary)' }
                : undefined
            }
          >
            {b.nom}
          </button>
        ))}
      </div>

      {/* Content */}
      {reloading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : view === 'table' ? (
        <PersonnelTable employes={filteredEmployes} boutiques={boutiques} />
      ) : filteredEmployes.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-xa-muted">Aucun employé dans cette sélection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployes.map((emp, i) => (
            <EmployeCard key={emp.id} employe={emp} color={getInitialsColor(i)} />
          ))}
        </div>
      )}

      {/* Add employee modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-xa-surface border border-xa-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-xa-border">
              <h2 className="font-semibold text-xa-text">
                Nouvel employé —{' '}
                {boutiques.find((b) => b.id === form.boutique_id)?.nom ?? ''}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-xa-muted hover:text-xa-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                    setForm((f) => ({ ...f, role: e.target.value as 'caissier' | 'gerant' }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
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
                {process.env.NODE_ENV === 'development' && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({
                      ...f,
                      pin: String(Math.floor(1000 + Math.random() * 9000)),
                    }))}
                    className="text-xs text-xa-muted underline mt-1"
                  >
                    🎲 PIN aléatoire (dev)
                  </button>
                )}
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
