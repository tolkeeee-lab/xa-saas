'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import ThemeToggle from '@/components/ui/ThemeToggle';

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
        <text
          x="4"
          y="46"
          fontFamily="Inter, sans-serif"
          fontWeight="700"
          fontSize="48"
          fill="currentColor"
        >
          x
        </text>
        <text
          x="38"
          y="46"
          fontFamily="Inter, sans-serif"
          fontWeight="700"
          fontSize="48"
          fill="currentColor"
        >
          à
        </text>
      </svg>
      <span className="text-xs font-medium tracking-widest text-xa-muted uppercase mt-1">
        Solution de Gestion
      </span>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen bg-xa-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm md:max-w-md">
        <div className="relative bg-xa-surface rounded-2xl shadow-sm border border-xa-border p-8">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>

          <XaLogo />

          <h1 className="text-xl font-semibold text-xa-text text-center mb-6">
            Nouveau mot de passe
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-xa-text mb-1"
              >
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-xa-border rounded-xl text-sm bg-xa-bg text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium text-xa-text mb-1"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-2.5 border border-xa-border rounded-xl text-sm bg-xa-bg text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-xa-danger bg-red-50 dark:bg-red-950 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-xa-primary text-white font-semibold py-3 rounded-xl hover:bg-xa-primary-light transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mise à jour…
                </>
              ) : (
                'Changer le mot de passe'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-xa-muted hover:text-xa-primary transition-colors"
            >
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
