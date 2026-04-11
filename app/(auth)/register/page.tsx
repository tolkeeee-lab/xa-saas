'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { hashPin } from '@/lib/pinHash';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    nomBoutique: '',
    pinCaisse: '',
    ville: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.pinCaisse.length < 4) {
      setError('Le PIN doit contenir au moins 4 chiffres.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const pinHash = await hashPin(form.pinCaisse);
    const codeUnique = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 6);

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nom_boutique: form.nomBoutique,
          ville: form.ville,
          pin_caisse: pinHash,
          code_unique: codeUnique,
        },
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-xa-bg py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-xa-primary">xà</h1>
          <p className="text-gray-500 mt-1">Créez votre boutique</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-xa-danger/30 text-xa-danger text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
            <input
              type="text"
              name="nomBoutique"
              required
              value={form.nomBoutique}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
              placeholder="Ma Boutique"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input
              type="text"
              name="ville"
              value={form.ville}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
              placeholder="Dakar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN caisse (4+ chiffres)</label>
            <input
              type="password"
              name="pinCaisse"
              required
              inputMode="numeric"
              pattern="[0-9]{4,8}"
              value={form.pinCaisse}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
              placeholder="••••"
            />
            <p className="text-xs text-gray-400 mt-1">Ce PIN permettra à vos caissiers de s&apos;identifier.</p>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Créer mon compte
          </Button>

          <p className="text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <a href="/login" className="text-xa-primary font-medium hover:underline">
              Se connecter
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
