'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { hashPin } from '@/lib/pinHash';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Boutique, Employe } from '@/types/database';

const ROLES: Employe['role'][] = ['caissier', 'gerant'];

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  telephone: '',
  role: 'caissier' as Employe['role'],
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

export default function EmployesPage() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [activeBoutiqueId, setActiveBoutiqueId] = useState<string>('');
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadBoutiques() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('boutiques')
        .select('*')
        .eq('proprietaire_id', user.id)
        .eq('actif', true)
        .order('created_at', { ascending: true });

      const list = data ?? [];
      setBoutiques(list);

      const stored = localStorage.getItem('xa-boutique-active');
      const active = list.find((b) => b.id === stored) ?? list[0];
      if (active) setActiveBoutiqueId(active.id);
    }
    loadBoutiques();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEmployes = useCallback(async () => {
    if (!activeBoutiqueId) return;
    setLoading(true);
    const { data } = await supabase
      .from('employes')
      .select('*')
      .eq('boutique_id', activeBoutiqueId)
      .order('nom', { ascending: true });
    setEmployes(data ?? []);
    setLoading(false);
  }, [activeBoutiqueId, supabase]);

  useEffect(() => {
    loadEmployes();
  }, [loadEmployes]);

  async function handleAddEmploye(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!form.nom.trim()) { setFormError('Le nom est obligatoire.'); return; }
    if (!form.prenom.trim()) { setFormError('Le prénom est obligatoire.'); return; }
    if (!/^\d{4}$/.test(form.pin)) { setFormError('Le PIN doit contenir exactement 4 chiffres.'); return; }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) { setFormError('Non authentifié.'); setSubmitting(false); return; }

    const pinHash = await hashPin(form.pin);

    const { error } = await supabase.from('employes').insert({
      boutique_id: activeBoutiqueId,
      proprietaire_id: user.id,
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim() || null,
      role: form.role,
      pin: pinHash,
      actif: true,
    });

    setSubmitting(false);
    if (error) { setFormError(error.message); return; }

    setShowModal(false);
    setForm(EMPTY_FORM);
    await loadEmployes();
  }

  const activeBoutique = boutiques.find((b) => b.id === activeBoutiqueId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={activeBoutiqueId}
          onChange={(e) => {
            setActiveBoutiqueId(e.target.value);
            localStorage.setItem('xa-boutique-active', e.target.value);
          }}
          className="px-3 py-2 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
        >
          {boutiques.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nom}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        <button
          onClick={() => { setShowModal(true); setFormError(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter employé
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : employes.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-xa-muted">
            {boutiques.length === 0
              ? "Créez d'abord une boutique."
              : 'Aucun employé dans cette boutique.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employes.map((emp, i) => (
            <EmployeCard key={emp.id} employe={emp} color={getInitialsColor(i)} />
          ))}
        </div>
      )}

      {/* Add employee modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-xa-surface border border-xa-border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-xa-border">
              <h2 className="font-semibold text-xa-text">
                Nouvel employé — {activeBoutique?.nom}
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
                    setForm((f) => ({ ...f, role: e.target.value as Employe['role'] }))
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

function EmployeCard({ employe, color }: { employe: Employe; color: string }) {
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
