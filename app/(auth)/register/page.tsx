'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

function XaLogo() {
  return (
    <div className="flex flex-col items-center mb-8">
      <svg
        width="80"
        height="56"
        viewBox="0 0 80 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="xà logo"
        role="img"
      >
        {/* Letter x */}
        <text
          x="4"
          y="46"
          fontFamily="Inter, sans-serif"
          fontWeight="700"
          fontSize="48"
          fill="#333333"
        >
          x
        </text>
        {/* Letter à */}
        <text
          x="38"
          y="46"
          fontFamily="Inter, sans-serif"
          fontWeight="700"
          fontSize="48"
          fill="#333333"
        >
          à
        </text>
      </svg>
      <span className="text-xs font-medium tracking-widest text-gray-500 uppercase mt-1">
        Solution de Gestion
      </span>
    </div>
  );
}

export default function RegisterPage() {
  const [nomComplet, setNomComplet] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nom_complet: nomComplet,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="min-h-screen bg-xa-bg flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm md:max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <XaLogo />
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Vérifiez votre email
            </h2>
            <p className="text-sm text-gray-500">
              Un lien de confirmation a été envoyé à{' '}
              <span className="font-medium text-gray-700">{email}</span>.
              Cliquez sur ce lien pour activer votre compte.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm text-xa-primary font-medium hover:underline"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-xa-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm md:max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <XaLogo />

          <h1 className="text-xl font-semibold text-gray-900 text-center mb-6">
            Créer un compte
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="nomComplet"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom complet
              </label>
              <input
                id="nomComplet"
                type="text"
                autoComplete="name"
                required
                value={nomComplet}
                onChange={(e) => setNomComplet(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary focus:border-transparent transition"
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary focus:border-transparent transition"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary focus:border-transparent transition"
                placeholder="Minimum 8 caractères"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-xa-danger bg-red-50 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-xa-primary text-white font-semibold py-3 rounded-xl hover:bg-opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création…
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="text-xa-primary font-medium hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
