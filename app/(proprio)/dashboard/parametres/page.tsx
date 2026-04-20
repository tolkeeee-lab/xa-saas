'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Profile, Boutique } from '@/types/database';

export default function ParametresPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [activeBoutiqueId, setActiveBoutiqueId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({ nom_complet: '', telephone: '' });
  const [boutiqueForm, setBoutiqueForm] = useState({
    nom: '',
    ville: '',
    quartier: '',
    couleur_theme: '#1c5d7d',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBoutique, setSavingBoutique] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [boutiqueMsg, setBoutiqueMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileData }, { data: boutiquesData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('boutiques')
          .select('*')
          .eq('proprietaire_id', user.id)
          .eq('actif', true)
          .order('created_at', { ascending: true }),
      ]);

      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          nom_complet: profileData.nom_complet ?? '',
          telephone: profileData.telephone ?? '',
        });
      }

      const list = boutiquesData ?? [];
      setBoutiques(list);

      const stored = localStorage.getItem('xa-boutique-active');
      const active = list.find((b) => b.id === stored) ?? list[0];
      if (active) {
        setActiveBoutiqueId(active.id);
        setBoutiqueForm({
          nom: active.nom,
          ville: active.ville,
          quartier: active.quartier ?? '',
          couleur_theme: active.couleur_theme,
        });
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBoutiqueSelect(id: string) {
    setActiveBoutiqueId(id);
    localStorage.setItem('xa-boutique-active', id);
    const b = boutiques.find((b) => b.id === id);
    if (b) {
      setBoutiqueForm({
        nom: b.nom,
        ville: b.ville,
        quartier: b.quartier ?? '',
        couleur_theme: b.couleur_theme,
      });
    }
  }

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setSavingProfile(false); return; }

    const { error } = await supabase
      .from('profiles')
      .update({
        nom_complet: profileForm.nom_complet.trim() || null,
        telephone: profileForm.telephone.trim() || null,
      })
      .eq('id', user.id);

    setSavingProfile(false);
    if (error) {
      setProfileMsg({ type: 'error', text: error.message });
    } else {
      setProfileMsg({ type: 'success', text: 'Profil mis à jour.' });
      if (profile) setProfile({ ...profile, ...profileForm });
    }
  }

  async function handleSaveBoutique(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBoutiqueMsg(null);
    if (!activeBoutiqueId) return;
    setSavingBoutique(true);

    const { error } = await supabase
      .from('boutiques')
      .update({
        nom: boutiqueForm.nom.trim(),
        ville: boutiqueForm.ville.trim(),
        quartier: boutiqueForm.quartier.trim() || null,
        couleur_theme: boutiqueForm.couleur_theme,
      })
      .eq('id', activeBoutiqueId);

    setSavingBoutique(false);
    if (error) {
      setBoutiqueMsg({ type: 'error', text: error.message });
    } else {
      setBoutiqueMsg({ type: 'success', text: 'Boutique mise à jour.' });
      setBoutiques((list) =>
        list.map((b) =>
          b.id === activeBoutiqueId ? { ...b, ...boutiqueForm } : b,
        ),
      );
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile section */}
      <section className="bg-xa-surface border border-xa-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-xa-text uppercase tracking-wider mb-5">
          Profil
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileMsg && (
            <div
              className={`p-3 rounded-lg text-sm border ${
                profileMsg.type === 'success'
                  ? 'border-aquamarine-500 text-aquamarine-600 dark:text-aquamarine-400'
                  : 'border-xa-danger text-xa-danger'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">Nom complet</label>
            <input
              type="text"
              value={profileForm.nom_complet}
              onChange={(e) => setProfileForm((f) => ({ ...f, nom_complet: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">Téléphone</label>
            <input
              type="tel"
              value={profileForm.telephone}
              onChange={(e) => setProfileForm((f) => ({ ...f, telephone: e.target.value }))}
              placeholder="+229 …"
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {savingProfile ? 'Sauvegarde…' : 'Enregistrer le profil'}
            </button>
          </div>
        </form>
      </section>

      {/* Active boutique section */}
      {boutiques.length > 0 && (
        <section className="bg-xa-surface border border-xa-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-xa-text uppercase tracking-wider">
              Boutique active
            </h2>
            {boutiques.length > 1 && (
              <select
                value={activeBoutiqueId}
                onChange={(e) => handleBoutiqueSelect(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              >
                {boutiques.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom}
                  </option>
                ))}
              </select>
            )}
          </div>

          <form onSubmit={handleSaveBoutique} className="space-y-4">
            {boutiqueMsg && (
              <div
                className={`p-3 rounded-lg text-sm border ${
                  boutiqueMsg.type === 'success'
                    ? 'border-aquamarine-500 text-aquamarine-600 dark:text-aquamarine-400'
                    : 'border-xa-danger text-xa-danger'
                }`}
              >
                {boutiqueMsg.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-xa-text mb-1.5">
                Nom <span className="text-xa-danger">*</span>
              </label>
              <input
                type="text"
                value={boutiqueForm.nom}
                onChange={(e) => setBoutiqueForm((f) => ({ ...f, nom: e.target.value }))}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-xa-text mb-1.5">
                  Ville <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="text"
                  value={boutiqueForm.ville}
                  onChange={(e) => setBoutiqueForm((f) => ({ ...f, ville: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-xa-text mb-1.5">Quartier</label>
                <input
                  type="text"
                  value={boutiqueForm.quartier}
                  onChange={(e) =>
                    setBoutiqueForm((f) => ({ ...f, quartier: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-xa-text mb-1.5">
                Couleur thème
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={boutiqueForm.couleur_theme}
                  onChange={(e) =>
                    setBoutiqueForm((f) => ({ ...f, couleur_theme: e.target.value }))
                  }
                  className="w-12 h-10 rounded-lg border border-xa-border cursor-pointer bg-xa-bg"
                />
                <span className="text-sm font-mono text-xa-muted">
                  {boutiqueForm.couleur_theme}
                </span>
                <div
                  className="w-8 h-8 rounded-lg border border-xa-border"
                  style={{ backgroundColor: boutiqueForm.couleur_theme }}
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={savingBoutique}
                className="px-5 py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingBoutique ? 'Sauvegarde…' : 'Enregistrer la boutique'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Categories section */}
      <section className="bg-xa-surface border border-xa-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-xa-text uppercase tracking-wider">
              Catégories de produits
            </h2>
            <p className="text-sm text-xa-muted mt-1">
              Personnalisez les catégories disponibles lors de l&apos;ajout de produits.
            </p>
          </div>
          <Link
            href="/dashboard/parametres/categories"
            className="px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Gérer
          </Link>
        </div>
      </section>
    </div>
  );
}
