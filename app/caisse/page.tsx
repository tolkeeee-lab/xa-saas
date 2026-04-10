'use client';
import { useState } from 'react';
import { createClient } from '../../lib/supabase-browser';
import type { Boutique, Employe } from '../../types/database';

type Step = 'code' | 'boutique' | 'role' | 'pin' | 'success';
type Acteur =
  | { type: 'proprietaire'; boutique: Boutique }
  | { type: 'employe'; employe: Employe; boutique: Boutique };

export default function CaissePage() {
  const [step, setStep] = useState<Step>('code');
  const [codeInput, setCodeInput] = useState('');
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [selectedBoutique, setSelectedBoutique] = useState<Boutique | null>(null);
  const [acteur, setActeur] = useState<Acteur | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('boutiques')
      .select('*')
      .eq('code_unique', codeInput.toUpperCase().trim())
      .eq('actif', true);
    setLoading(false);
    if (!data || data.length === 0) {
      setError('Code introuvable. Vérifiez le code donné par votre patron.');
      return;
    }
    setBoutiques(data);
    if (data.length === 1) {
      setSelectedBoutique(data[0]);
      await loadEmployes(data[0].id);
      setStep('role');
    } else {
      setStep('boutique');
    }
  };

  const loadEmployes = async (boutiqueId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('employes')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .eq('actif', true)
      .order('nom');
    setEmployes(data ?? []);
  };

  const selectBoutique = async (boutique: Boutique) => {
    setSelectedBoutique(boutique);
    await loadEmployes(boutique.id);
    setStep('role');
  };

  const selectActeur = (a: Acteur) => {
    setActeur(a);
    setPin('');
    setError(null);
    setStep('pin');
  };

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      let expected: string | null = null;
      if (acteur?.type === 'proprietaire') expected = acteur.boutique.pin_caisse;
      if (acteur?.type === 'employe') expected = acteur.employe.pin;
      if (next === expected) {
        setStep('success');
      } else {
        setError('PIN incorrect, réessayez');
        setPin('');
      }
    }
  };

  const handleDelete = () => { setPin(p => p.slice(0, -1)); setError(null); };

  const reset = () => {
    setStep('code'); setCodeInput(''); setBoutiques([]); setEmployes([]);
    setSelectedBoutique(null); setActeur(null); setPin(''); setError(null);
  };

  if (step === 'success' && acteur) {
    const nom = acteur.type === 'proprietaire'
      ? 'Patron'
      : `${acteur.employe.nom}${acteur.employe.prenom ? ' ' + acteur.employe.prenom : ''}`;
    return (
      <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold text-xa-primary mb-4">xà</h1>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-2xl mb-2">👋</p>
            <p className="text-lg font-semibold text-gray-800 mb-1">Bienvenue {nom} !</p>
            <p className="text-gray-400 text-sm">Caisse en construction 🚧</p>
          </div>
          <button onClick={reset} className="mt-6 text-sm text-gray-400">← Retour à la sélection</button>
        </div>
      </main>
    );
  }

  if (step === 'pin' && acteur) {
    const nom = acteur.type === 'proprietaire'
      ? 'Propriétaire'
      : acteur.employe.nom;
    return (
      <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => { setStep('role'); setPin(''); setError(null); }} className="text-sm text-gray-400 mb-6 block">← Retour</button>
          <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">{selectedBoutique?.nom}</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">PIN de {nom}</p>
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-4">
              {[0,1,2,3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition ${i < pin.length ? 'bg-xa-primary border-xa-primary' : 'border-gray-300 bg-white'}`} />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="grid grid-cols-3 gap-3">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, idx) => (
                <button key={idx}
                  onClick={() => { if (key === '⌫') handleDelete(); else if (key) handleDigit(key); }}
                  disabled={key === ''}
                  className={`w-16 h-16 rounded-xl text-xl font-bold flex items-center justify-center transition ${key === '' ? 'invisible' : key === '⌫' ? 'bg-white shadow border border-gray-200 text-red-400 active:bg-gray-100' : 'bg-white shadow border border-gray-200 text-gray-800 active:bg-xa-primary active:text-white'}`}>
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (step === 'role' && selectedBoutique) {
    return (
      <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => boutiques.length > 1 ? setStep('boutique') : setStep('code')} className="text-sm text-gray-400 mb-6 block">← Retour</button>
          <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">{selectedBoutique.nom}</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">Qui êtes-vous ?</p>
          <div className="space-y-3">
            <button onClick={() => selectActeur({ type: 'proprietaire', boutique: selectedBoutique })}
              className="w-full bg-xa-primary text-white rounded-2xl p-4 text-left font-semibold flex items-center gap-3 hover:bg-xa-primary/90 transition">
              <span className="text-2xl">👔</span>
              <span>Je suis le propriétaire</span>
            </button>
            {employes.length > 0 && <p className="text-xs text-gray-400 text-center pt-2">— ou sélectionnez votre nom —</p>}
            {employes.map(emp => (
              <button key={emp.id} onClick={() => selectActeur({ type: 'employe', employe: emp, boutique: selectedBoutique })}
                className="w-full bg-white rounded-2xl shadow p-4 text-left hover:ring-2 hover:ring-xa-primary transition">
                <p className="font-semibold text-gray-800">{emp.nom}{emp.prenom ? ` ${emp.prenom}` : ''}</p>
                <p className="text-xs text-gray-400 capitalize">{emp.role}</p>
              </button>
            ))}
            {employes.length === 0 && <p className="text-gray-400 text-sm text-center">Aucun employé enregistré</p>}
          </div>
        </div>
      </main>
    );
  }

  if (step === 'boutique') {
    return (
      <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => setStep('code')} className="text-sm text-gray-400 mb-6 block">← Retour</button>
          <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">Sélectionnez votre boutique</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">Code : {codeInput.toUpperCase()}</p>
          <div className="space-y-3">
            {boutiques.map(b => (
              <button key={b.id} onClick={() => void selectBoutique(b)}
                className="w-full bg-white rounded-2xl shadow p-4 text-left hover:ring-2 hover:ring-xa-primary transition">
                <p className="font-semibold text-gray-800">{b.nom}</p>
                {b.ville && <p className="text-sm text-gray-400">{b.ville}</p>}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // step === 'code'
  return (
    <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-xa-primary mb-1 text-center">xà</h1>
        <p className="text-gray-500 text-sm mb-8 text-center">Entrez le code de votre patron</p>
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <input
            type="text"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            required
            minLength={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-4 text-center text-2xl font-mono font-bold tracking-widest outline-none focus:ring-2 focus:ring-xa-primary bg-white uppercase"
            placeholder="EX: DUPONT42"
            autoCapitalize="characters"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-xa-primary text-white font-semibold rounded-xl py-3 hover:bg-xa-primary/90 transition disabled:opacity-50">
            {loading ? 'Recherche...' : 'Valider'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-8">
          Vous êtes patron ?{' '}
          <a href="/login" className="text-xa-primary font-medium">Connexion admin</a>
        </p>
      </div>
    </main>
  );
}
