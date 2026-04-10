'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase-browser';
import type { Boutique, Employe } from '../../types/database';

type Step = 'boutique' | 'employe' | 'pin' | 'success';

export default function CaissePage() {
  const [step, setStep] = useState<Step>('boutique');
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [selectedBoutique, setSelectedBoutique] = useState<Boutique | null>(null);
  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('boutiques')
      .select('*')
      .eq('actif', true)
      .order('nom')
      .then(({ data }) => {
        setBoutiques(data ?? []);
        setLoading(false);
      });
  }, []);

  const selectBoutique = async (boutique: Boutique) => {
    setSelectedBoutique(boutique);
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('employes')
      .select('*')
      .eq('boutique_id', boutique.id)
      .eq('actif', true)
      .order('nom');
    setEmployes(data ?? []);
    setLoading(false);
    setStep('employe');
  };

  const selectEmploye = (employe: Employe) => {
    setSelectedEmploye(employe);
    setPin('');
    setError(null);
    setStep('pin');
  };

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4 && selectedEmploye) {
      if (selectedEmploye.pin === next) {
        setStep('success');
      } else {
        setError('PIN incorrect, réessayez');
        setPin('');
      }
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-xa-bg flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </main>
    );
  }

  if (step === 'success' && selectedEmploye) {
    return (
      <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold text-xa-primary mb-4">xà</h1>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-2xl mb-2">👋</p>
            <p className="text-lg font-semibold text-gray-800 mb-1">
              Bienvenue {selectedEmploye.nom}{selectedEmploye.prenom ? ` ${selectedEmploye.prenom}` : ''} !
            </p>
            <p className="text-gray-400 text-sm">Caisse en construction 🚧</p>
          </div>
          <button
            onClick={() => { setStep('boutique'); setSelectedBoutique(null); setSelectedEmploye(null); setPin(''); setError(null); }}
            className="mt-6 text-sm text-gray-400"
          >
            ← Retour à la sélection
          </button>
        </div>
      </main>
    );
  }

  if (step === 'boutique') {
    return (
      <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold text-xa-primary mb-1 text-center">xà</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">Sélectionnez votre boutique</p>
          <div className="space-y-3">
            {boutiques.length === 0 && (
              <p className="text-gray-400 text-sm text-center">Aucune boutique disponible</p>
            )}
            {boutiques.map(b => (
              <button
                key={b.id}
                onClick={() => void selectBoutique(b)}
                className="w-full bg-white rounded-2xl shadow p-4 text-left hover:ring-2 hover:ring-xa-primary transition"
              >
                <p className="font-semibold text-gray-800">{b.nom}</p>
                {b.ville && <p className="text-sm text-gray-400">{b.ville}</p>}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (step === 'employe') {
    return (
      <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => setStep('boutique')} className="text-sm text-gray-400 mb-6 block">
            ← Retour
          </button>
          <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">{selectedBoutique?.nom}</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">Sélectionnez un employé</p>
          <div className="space-y-3">
            {employes.length === 0 && (
              <p className="text-gray-400 text-sm text-center">Aucun employé actif</p>
            )}
            {employes.map(emp => (
              <button
                key={emp.id}
                onClick={() => selectEmploye(emp)}
                className="w-full bg-white rounded-2xl shadow p-4 text-left hover:ring-2 hover:ring-xa-primary transition"
              >
                <p className="font-semibold text-gray-800">{emp.nom}{emp.prenom ? ` ${emp.prenom}` : ''}</p>
                <p className="text-xs text-gray-400 capitalize">{emp.role}</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <button onClick={() => { setStep('employe'); setPin(''); setError(null); }} className="text-sm text-gray-400 mb-6 block">
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">{selectedBoutique?.nom}</h1>
        <p className="text-gray-500 text-sm mb-8 text-center">
          PIN de {selectedEmploye?.nom}
        </p>

        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition ${i < pin.length ? 'bg-xa-primary border-xa-primary' : 'border-gray-300 bg-white'}`}
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, idx) => (
              <button
                key={idx}
                onClick={() => { if (key === '⌫') handleDelete(); else if (key) handleDigit(key); }}
                disabled={key === ''}
                className={`w-16 h-16 rounded-xl text-xl font-bold flex items-center justify-center transition
                  ${key === '' ? 'invisible' : key === '⌫' ? 'bg-white shadow border border-gray-200 text-red-400 active:bg-gray-100' : 'bg-white shadow border border-gray-200 text-gray-800 active:bg-gray-100'}`}
              >
                {key}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setStep('employe'); setPin(''); setError(null); }}
            className="text-sm text-gray-400"
          >
            ← Changer d&apos;employé
          </button>
        </div>
      </div>
    </main>
  );
}
