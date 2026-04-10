'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase-browser';
import { hashPin } from '../../lib/pinHash';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomBoutique, setNomBoutique] = useState('');
  const [codeUnique, setCodeUnique] = useState('');
  const [pinCaisse, setPinCaisse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[A-Z0-9]{4,}$/.test(codeUnique.toUpperCase().trim())) {
      setError('Le code unique doit contenir au moins 4 caractères alphanumériques');
      return;
    }
    if (!/^\d{4}$/.test(pinCaisse)) {
      setError('Le PIN caisse doit être exactement 4 chiffres');
      return;
    }
    setLoading(true);
    const pinHash = await hashPin(pinCaisse);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nom_boutique: nomBoutique,
          code_unique: codeUnique.toUpperCase().trim(),
          pin_caisse: pinHash,
        },
      },
    });
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Erreur lors de l'inscription");
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold text-xa-primary mb-4">xà</h1>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-4xl mb-3">📧</p>
            <p className="font-semibold text-gray-800 mb-2">Vérifiez votre email</p>
            <p className="text-sm text-gray-500">
              Un lien de confirmation a été envoyé à{' '}
              <strong className="text-gray-700">{email}</strong>.
            </p>
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">
            Déjà confirmé ?{' '}
            <Link href="/login" className="text-xa-primary font-medium">Se connecter</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-xa-primary mb-1 text-center">xà</h1>
        <p className="text-gray-500 text-sm mb-8 text-center">Créez votre espace</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
            <input type="text" value={nomBoutique} onChange={e => setNomBoutique(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" placeholder="Ma boutique" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code unique</label>
            <input type="text" value={codeUnique} onChange={e => setCodeUnique(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} required minLength={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white font-mono tracking-widest" placeholder="ex: DUPONT42" />
            <p className="text-xs text-gray-400 mt-1">Partagez ce code avec vos employés</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN caisse (4 chiffres)</label>
            <input type="password" inputMode="numeric" value={pinCaisse} onChange={e => setPinCaisse(e.target.value.replace(/\D/g, '').slice(0, 4))} required maxLength={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" placeholder="••••" />
            <p className="text-xs text-gray-400 mt-1">Votre code d&apos;accès à la caisse</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" placeholder="vous@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" placeholder="6 caractères minimum" />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-xa-primary text-white font-semibold rounded-xl py-3 mt-2 hover:bg-xa-primary/90 transition disabled:opacity-50">
            {loading ? 'Création...' : 'Créer mon espace'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-xa-primary font-medium">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}