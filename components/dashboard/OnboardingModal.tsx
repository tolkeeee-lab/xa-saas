'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

const COLORS = [
  '#6c2ed1', '#e53e3e', '#dd6b20', '#38a169',
  '#2b6cb0', '#d53f8c', '#319795', '#744210',
];

export default function OnboardingModal() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nom: '',
    ville: '',
    quartier: '',
    couleur_theme: COLORS[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  async function handleCreateBoutique() {
    setError(null);
    if (!form.nom.trim() || !form.ville.trim()) {
      setError('Le nom et la ville sont obligatoires.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Session expirée.'); setLoading(false); return; }

    const code_unique = form.nom.trim().toUpperCase().slice(0, 4).replace(/\s/g, '') + Math.random().toString(36).slice(2, 5).toUpperCase();
    const { error: insertError } = await supabase.from('boutiques').insert({
      proprietaire_id: user.id,
      nom: form.nom.trim(),
      ville: form.ville.trim(),
      quartier: form.quartier.trim() || null,
      code_unique,
      pin_caisse: '0000',
      couleur_theme: form.couleur_theme,
      actif: true,
    });
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    setStep(3);
  }

  function handleDone() {
    localStorage.setItem('xa-onboarding-done', '1');
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-xa-surface rounded-2xl border border-xa-border p-8 max-w-lg w-full shadow-2xl">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s <= step
                    ? 'bg-xa-primary text-white'
                    : 'bg-xa-bg border border-xa-border text-xa-muted'
                }`}  
              >
                {s < step ? '✓' : s}
              </div>
              {i < 2 && (
                <div className={`w-12 h-0.5 ${s < step ? 'bg-xa-primary' : 'bg-xa-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Étape 1 : Bienvenue */}
        {step === 1 && (
          <div className="text-center">
            <div className="text-4xl mb-4">👋</div>
            <h2 className="text-xl font-bold text-xa-text mb-2">Bienvenue sur xà !</h2>
            <p className="text-sm text-xa-muted mb-6">Votre solution de gestion multi-boutiques pour le marché béninois.</p>
            <ul className="text-left space-y-3 mb-8">
              {[
                { icon: '💰', text: 'Gérez vos ventes et encaissements en temps réel' },
                { icon: '📦', text: 'Suivez vos stocks et recevez des alertes automatiques' },
                { icon: '📊', text: 'Analysez vos performances avec des rapports détaillés' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{icon}</span>
                  <span className="text-sm text-xa-text">{text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-xa-primary text-white font-semibold py-3 rounded-xl hover:bg-xa-primary-light transition"
            >
              Créer ma première boutique →
            </button>
          </div>
        )}

        {/* Étape 2 : Formulaire boutique */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-xa-text mb-1 text-center">Créer votre boutique</h2>
            <p className="text-sm text-xa-muted text-center mb-6">Vous pourrez en ajouter d&apos;autres plus tard.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">Nom de la boutique *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={set('nom')}
                  placeholder="Ex. : Épicerie du Centre"
                  className="w-full px-4 py-2.5 border border-xa-border rounded-xl text-sm bg-xa-bg text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">Ville *</label>
                <input
                  type="text"
                  value={form.ville}
                  onChange={set('ville')}
                  placeholder="Ex. : Cotonou"
                  className="w-full px-4 py-2.5 border border-xa-border rounded-xl text-sm bg-xa-bg text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">Quartier <span className="text-xa-muted font-normal">(optionnel)</span></label>
                <input
                  type="text"
                  value={form.quartier}
                  onChange={set('quartier')}
                  placeholder="Ex. : Akpakpa"
                  className="w-full px-4 py-2.5 border border-xa-border rounded-xl text-sm bg-xa-bg text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-xa-text mb-2">Couleur de la boutique</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((p) => ({ ...p, couleur_theme: c }))}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${form.couleur_theme === c ? 'ring-2 ring-offset-2 ring-xa-primary scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            {error && (
              <p className="mt-4 text-sm text-xa-danger bg-red-50 dark:bg-red-950 rounded-xl px-4 py-3">{error}</p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-xa-border text-xa-text font-medium py-3 rounded-xl hover:bg-xa-bg transition"
              >
                ← Retour
              </button>
              <button
                onClick={handleCreateBoutique}
                disabled={loading}
                className="flex-1 bg-xa-primary text-white font-semibold py-3 rounded-xl hover:bg-xa-primary-light transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {loading ? 'Création…' : 'Créer la boutique →'}
              </button>
            </div>
          </div>
        )}

        {/* Étape 3 : Confirmation */}
        {step === 3 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-xa-text mb-2">Votre boutique est prête !</h2>
            <p className="text-sm text-xa-muted mb-2">
              <span className="font-semibold text-xa-text">{form.nom}</span> à {form.ville} a été créée avec succès.
            </p>
            <p className="text-sm text-xa-muted mb-8">
              Vous pouvez maintenant ajouter vos produits, employés et commencer à encaisser.
            </p>
            <button
              onClick={handleDone}
              className="w-full bg-xa-primary text-white font-semibold py-3 rounded-xl hover:bg-xa-primary-light transition"
            >
              Commencer 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}