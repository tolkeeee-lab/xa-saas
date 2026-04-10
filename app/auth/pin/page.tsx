'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth/AuthContext';
import type { Boutique, Employe } from '../../../types/database';

export const dynamic = 'force-dynamic';

function PinPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const boutiqueId = params.get('boutique_id') ?? '';
  const { login } = useAuth();

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boutiqueId) { router.replace('/auth/boutique'); return; }
    Promise.all([
      supabase.from('boutiques').select('*').eq('id', boutiqueId).single(),
      supabase.from('employes').select('*').eq('boutique_id', boutiqueId).eq('actif', true).order('nom'),
    ]).then(([{ data: b, error: e1 }, { data: emps }]) => {
      if (e1 || !b) { router.replace('/auth/boutique'); return; }
      setBoutique(b);
      setEmployes(emps ?? []);
      setLoading(false);
    });
  }, [boutiqueId, router]);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4 && selectedEmploye) validatePin(selectedEmploye, next);
  };

  const handleDelete = () => { setPin(p => p.slice(0, -1)); setError(null); };

  const validatePin = (emp: Employe, p: string) => {
    // TODO: comparer avec un PIN haché (bcrypt) en production
    if (emp.pin === p) {
      login(boutique!, emp);
      router.push('/dashboard');
    } else {
      setError('PIN incorrect, réessayez');
      setPin('');
    }
  };

  if (loading) return (
    <main className="min-h-screen bg-xa-bg flex items-center justify-center">
      <p className="text-gray-400">Chargement...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <button onClick={() => router.push('/auth/boutique')} className="text-sm text-gray-400 mb-6 block">
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">{boutique?.nom}</h1>
        <p className="text-gray-500 mb-8 text-sm text-center">
          {selectedEmploye ? `PIN de ${selectedEmploye.nom}` : 'Sélectionnez un employé'}
        </p>

        {!selectedEmploye ? (
          <div className="space-y-3">
            {employes.map((emp) => (
              <button key={emp.id} onClick={() => { setSelectedEmploye(emp); setPin(''); setError(null); }}
                className="w-full bg-white rounded-2xl shadow p-4 text-left hover:ring-2 hover:ring-xa-primary transition">
                <p className="font-semibold text-gray-800">{emp.nom}{emp.prenom ? ` ${emp.prenom}` : ''}</p>
                <p className="text-xs text-gray-400 capitalize">{emp.role}</p>
              </button>
            ))}
          </div>
        ) : (
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
                  className={`w-16 h-16 rounded-xl text-xl font-bold flex items-center justify-center transition
                    ${key === '' ? 'invisible' : key === '⌫' ? 'bg-white shadow border border-gray-200 text-red-400 active:bg-gray-100' : 'bg-white shadow border border-gray-200 text-gray-800 active:bg-gray-100'}`}
                >
                  {key}
                </button>
              ))}
            </div>

            <button onClick={() => { setSelectedEmploye(null); setPin(''); setError(null); }}
              className="text-sm text-gray-400">
              ← Changer d&apos;employé
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PinPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-xa-bg flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </main>
    }>
      <PinPageInner />
    </Suspense>
  );
}
