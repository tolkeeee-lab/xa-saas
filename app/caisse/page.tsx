'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { hashPin } from '@/lib/pinHash';
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

export default function CaissePage() {
  const router = useRouter();
  const [codeUnique, setCodeUnique] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleDigit(digit: string) {
    if (pin.length < 4) {
      setPin((p) => p + digit);
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1));
  }

  async function handleSubmit() {
    if (!codeUnique.trim()) {
      setError('Veuillez entrer le code de la boutique.');
      return;
    }
    if (pin.length !== 4) {
      setError('Le PIN doit contenir 4 chiffres.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Step 1: find boutique
      const boutiqueRes = await fetch(
        `/api/caisse/boutique?code=${encodeURIComponent(codeUnique.trim().toUpperCase())}`,
      );
      if (!boutiqueRes.ok) {
        const json = (await boutiqueRes.json()) as { error?: string };
        setError(json.error ?? 'Boutique introuvable');
        setLoading(false);
        return;
      }
      const boutique = (await boutiqueRes.json()) as { id: string; nom: string };

      // Step 2: verify PIN (hash client-side first)
      const hashedPin = await hashPin(pin);
      const verifyRes = await fetch('/api/caisse/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boutique_id: boutique.id, pin: hashedPin }),
      });

      if (!verifyRes.ok) {
        const json = (await verifyRes.json()) as { error?: string };
        setError(json.error ?? 'Code PIN incorrect ou employé introuvable');
        setPin('');
        setLoading(false);
        return;
      }

      const employe = (await verifyRes.json()) as {
        employe_id: string;
        employe_nom: string;
        boutique_id: string;
      };

      // Step 3: store session and redirect
      sessionStorage.setItem(
        'xa-caissier',
        JSON.stringify({
          employe_id: employe.employe_id,
          boutique_id: boutique.id,
          employe_nom: employe.employe_nom,
          boutique_nom: boutique.nom,
        }),
      );
      router.push('/caisse/pos');
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
      setLoading(false);
    }
  }

  const PIN_PAD = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <main className="min-h-screen bg-xa-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="relative bg-xa-surface rounded-2xl shadow-sm border border-xa-border p-8">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>

          <XaLogo />

          <h1 className="text-xl font-semibold text-xa-text text-center mb-6">
            Accès Caissier
          </h1>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="codeUnique"
                className="block text-sm font-medium text-xa-text mb-1"
              >
                Code de la boutique
              </label>
              <input
                id="codeUnique"
                type="text"
                value={codeUnique}
                onChange={(e) => setCodeUnique(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 border border-xa-border rounded-xl text-sm bg-xa-bg text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary focus:border-transparent transition uppercase"
                placeholder="Ex: EPIC123"
                autoCapitalize="characters"
              />
            </div>

            {/* PIN dots */}
            <div>
              <label className="block text-sm font-medium text-xa-text mb-2 text-center">
                Code PIN (4 chiffres)
              </label>
              <div className="flex justify-center gap-4 mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                      i < pin.length
                        ? 'bg-xa-primary border-xa-primary'
                        : 'border-xa-border bg-xa-bg'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Numeric pad */}
            <div className="space-y-2">
              {PIN_PAD.map((row) => (
                <div key={row.join('')} className="flex gap-2">
                  {row.map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handleDigit(digit)}
                      className="flex-1 py-3 rounded-xl border border-xa-border bg-xa-bg text-xa-text font-semibold text-lg hover:bg-xa-primary hover:text-white hover:border-xa-primary transition-colors"
                    >
                      {digit}
                    </button>
                  ))}
                </div>
              ))}
              <div className="flex gap-2">
                <button
                  onClick={handleBackspace}
                  className="flex-1 py-3 rounded-xl border border-xa-border bg-xa-bg text-xa-muted font-semibold hover:bg-xa-bg transition-colors"
                >
                  ⌫
                </button>
                <button
                  onClick={() => handleDigit('0')}
                  className="flex-1 py-3 rounded-xl border border-xa-border bg-xa-bg text-xa-text font-semibold text-lg hover:bg-xa-primary hover:text-white hover:border-xa-primary transition-colors"
                >
                  0
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || pin.length !== 4}
                  className="flex-1 py-3 rounded-xl bg-xa-primary text-white font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    '→'
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-xa-danger bg-red-50 dark:bg-red-950 rounded-xl px-4 py-3 text-center">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
