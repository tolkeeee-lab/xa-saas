'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { hashPin } from '@/lib/pinHash';

function generateCodeUnique(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((n) => chars[n % chars.length])
    .join('');
}

export default function NewBoutiquePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nom: '',
    ville: '',
    quartier: '',
    pin: '',
    couleur_theme: '#1c5d7d',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!form.nom.trim()) {
      setError('Le nom de la boutique est obligatoire.');
      return;
    }
    if (!form.ville.trim()) {
      setError('La ville est obligatoire.');
      return;
    }
    if (!/^\d{4}$/.test(form.pin)) {
      setError('Le PIN caisse doit contenir exactement 4 chiffres.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const pinHash = await hashPin(form.pin);
      const codeUnique = generateCodeUnique();

      const { error: insertError } = await supabase.from('boutiques').insert({
        proprietaire_id: user.id,
        nom: form.nom.trim(),
        ville: form.ville.trim(),
        quartier: form.quartier.trim() || null,
        code_unique: codeUnique,
        pin_caisse: pinHash,
        couleur_theme: form.couleur_theme,
        actif: true,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push('/dashboard/boutiques');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-xa-surface border border-xa-border rounded-xl p-6 space-y-5"
      >
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-xa-danger text-xa-danger text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-xa-text mb-1.5">
            Nom de la boutique <span className="text-xa-danger">*</span>
          </label>
          <input
            name="nom"
            type="text"
            value={form.nom}
            onChange={handleChange}
            placeholder="Ex : Boutique Centrale"
            required
            className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm placeholder:text-xa-muted focus:outline-none focus:ring-2 focus:ring-xa-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Ville <span className="text-xa-danger">*</span>
            </label>
            <input
              name="ville"
              type="text"
              value={form.ville}
              onChange={handleChange}
              placeholder="Cotonou"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm placeholder:text-xa-muted focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">Quartier</label>
            <input
              name="quartier"
              type="text"
              value={form.quartier}
              onChange={handleChange}
              placeholder="Akpakpa"
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm placeholder:text-xa-muted focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-xa-text mb-1.5">
            PIN caisse (4 chiffres) <span className="text-xa-danger">*</span>
          </label>
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={form.pin}
            onChange={handleChange}
            placeholder="••••"
            required
            className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm placeholder:text-xa-muted focus:outline-none focus:ring-2 focus:ring-xa-primary"
          />
          <p className="text-xs text-xa-muted mt-1">
            Ce PIN sera haché SHA-256 avant stockage.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-xa-text mb-1.5">
            Couleur thème
          </label>
          <div className="flex items-center gap-3">
            <input
              name="couleur_theme"
              type="color"
              value={form.couleur_theme}
              onChange={handleChange}
              className="w-12 h-10 rounded-lg border border-xa-border cursor-pointer bg-xa-bg"
            />
            <span className="text-sm font-mono text-xa-muted">{form.couleur_theme}</span>
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/boutiques')}
            className="flex-1 px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm font-medium hover:bg-xa-bg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Création…' : 'Créer la boutique'}
          </button>
        </div>
      </form>
    </div>
  );
}
