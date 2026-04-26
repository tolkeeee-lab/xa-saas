'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import ThemeToggle from '@/components/ui/ThemeToggle';

function XaLogo() {
  return (
    <div className="flex flex-col items-center mb-6">
      <div
        style={{
          animation: 'xa-ring-pulse 2s ease-in-out infinite',
          borderRadius: '50%',
          padding: '4px',
          display: 'inline-flex',
        }}
      >
        <svg
          width="88"
          height="62"
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
            fill="#14d9eb"
          >
            à
          </text>
        </svg>
      </div>
      <span className="text-xs font-medium tracking-widest text-xa-muted uppercase mt-1">
        Solution de Gestion
      </span>
      <p className="mt-3 text-sm text-xa-muted text-center">
        Gérez vos boutiques, où que vous soyez.
      </p>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        background: 'linear-gradient(135deg, #0f061d 0%, #6c2ed1 40%, #14d9eb 70%, #0f061d 100%)',
        backgroundSize: '300% 300%',
        animation: 'xa-gradient-rotate 10s ease infinite',
      }}
    >
      <div className="w-full max-w-sm md:max-w-md">
        <div
          style={{
            background: 'rgba(15, 6, 29, 0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(108,46,209,0.35)',
            borderRadius: '1.25rem',
            boxShadow: '0 0 60px rgba(108,46,209,0.3), 0 4px 32px rgba(0,0,0,0.5)',
            padding: '2rem',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
            <ThemeToggle />
          </div>

          <XaLogo />

          <h1 className="text-xl font-semibold text-center mb-6" style={{ color: '#f0eafa' }}>
            Connexion
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
                style={{ color: '#c4abed' }}
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
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  border: '1px solid rgba(108,46,209,0.4)',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  background: 'rgba(108,46,209,0.12)',
                  color: '#f0eafa',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,46,209,0.45)';
                  e.currentTarget.style.borderColor = '#8a58da';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(108,46,209,0.4)';
                }}
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
                style={{ color: '#c4abed' }}
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  border: '1px solid rgba(108,46,209,0.4)',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  background: 'rgba(108,46,209,0.12)',
                  color: '#f0eafa',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,46,209,0.45)';
                  e.currentTarget.style.borderColor = '#8a58da';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(108,46,209,0.4)';
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#ff3341',
                  background: 'rgba(255,51,65,0.1)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                fontWeight: '600',
                fontSize: '0.9375rem',
                color: '#fff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                background: 'linear-gradient(90deg, #6c2ed1, #14d9eb, #6c2ed1)',
                backgroundSize: '200% auto',
                animation: 'xa-shimmer 2.5s linear infinite',
                transition: 'opacity 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {loading ? (
                <>
                  <span
                    className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                  />
                  Connexion…
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#a782e3' }}>
            Pas encore partenaire&nbsp;?{' '}
            <Link
              href="/inscription"
              style={{ color: '#14d9eb', fontWeight: '500' }}
              className="hover:underline"
            >
              Devenir partenaire MAFRO →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
