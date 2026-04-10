'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase-browser';
import type { Employe, EmployeRole } from '../../../types/database';

export const dynamic = 'force-dynamic';

function EmployesPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const boutiqueId = params.get('boutique_id') ?? '';

  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [role, setRole] = useState<EmployeRole>('caissier');
  const [pin, setPin] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadEmployes = useCallback(async () => {
    if (!boutiqueId) return;
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('employes')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .eq('actif', true)
      .order('nom');
    if (err) setError(err.message);
    else setEmployes(data ?? []);
    setLoading(false);
  }, [boutiqueId]);

  useEffect(() => {
    if (!boutiqueId) {
      router.replace('/dashboard');
      return;
    }
    void loadEmployes();
  }, [boutiqueId, router, loadEmployes]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!/^\d{4}$/.test(pin)) {
      setFormError('Le PIN doit être exactement 4 chiffres');
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from('employes')
      .insert({
        boutique_id: boutiqueId,
        nom,
        prenom: prenom || null,
        role,
        pin,
        actif: true,
        telephone: null,
      });
    if (insertError) {
      setFormError(insertError.message);
      setSubmitting(false);
      return;
    }
    setNom('');
    setPrenom('');
    setRole('caissier');
    setPin('');
    setSubmitting(false);
    await loadEmployes();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('employes').update({ actif: false }).eq('id', id);
    await loadEmployes();
  };

  return (
    <main className="min-h-screen bg-xa-bg p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-xa-primary">Gestion des employés</h1>
          <Link href="/dashboard" className="text-sm text-gray-400">← Retour</Link>
        </div>

        {loading && <p className="text-gray-400 text-sm text-center">Chargement...</p>}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {!loading && (
          <div className="space-y-3 mb-8">
            {employes.length === 0 && (
              <p className="text-gray-400 text-sm text-center">Aucun employé pour l&apos;instant</p>
            )}
            {employes.map(emp => (
              <div key={emp.id} className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{emp.nom}{emp.prenom ? ` ${emp.prenom}` : ''}</p>
                  <p className="text-xs text-gray-400 capitalize">{emp.role}</p>
                </div>
                <button
                  onClick={() => void handleDelete(emp.id)}
                  className="text-sm text-red-400 hover:text-red-600 transition"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Ajouter un employé</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Nom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Prénom (optionnel)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as EmployeRole)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
              >
                <option value="caissier">Caissier</option>
                <option value="gerant">Gérant</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4 chiffres) *</label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                maxLength={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="••••"
              />
            </div>

            {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-xa-primary text-white font-semibold rounded-xl py-2.5 hover:bg-xa-primary/90 transition disabled:opacity-50"
            >
              {submitting ? 'Ajout...' : 'Ajouter'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function EmployesPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-xa-bg flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </main>
    }>
      <EmployesPageInner />
    </Suspense>
  );
}
