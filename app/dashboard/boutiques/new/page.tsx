'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase-browser';
import { hashPin } from '../../../../lib/pinHash';

export default function NewBoutiquePage() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [codeUnique, setCodeUnique] = useState('');
  const [pinRaw, setPinRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (codeUnique && !/^[A-Z0-9]{4,}$/.test(codeUnique)) {
      setError('Le code doit contenir au moins 4 caractères alphanumériques');
      return;
    }
    if (pinRaw && !/^\d{4}$/.test(pinRaw)) {
      setError('Le PIN doit être exactement 4 chiffres');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const pinHash = pinRaw ? await hashPin(pinRaw) : null;

    const { error: insertError } = await supabase.from('boutiques').insert({
      nom: nom.trim(),
      ville: ville.trim() || null,
      adresse: adresse.trim() || null,
      telephone: telephone.trim() || null,
      proprietaire_id: user.id,
      actif: true,
      code_unique: codeUnique || null,
      pin_caisse: pinHash,
    });

    setLoading(false);
    if (insertError) { setError(insertError.message); return; }
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-xa-bg p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-xa-primary">Nouvelle boutique</h1>
          <Link href="/dashboard" className="text-sm text-gray-400">← Retour</Link>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Nom de la boutique" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input type="text" value={ville} onChange={e => setVille(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Cotonou (optionnel)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input type="text" value={adresse} onChange={e => setAdresse(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Adresse (optionnel)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="+229 xx xx xx xx (optionnel)" />
            </div>

            <hr className="border-gray-100" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code unique caisse</label>
              <input type="text" value={codeUnique}
                onChange={e => setCodeUnique(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                minLength={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="ex: BOUTIQUE2 (optionnel)" />
              <p className="text-xs text-gray-400 mt-1">Partagez ce code avec vos employés pour accéder à la caisse</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN caisse (4 chiffres)</label>
              <input type="password" inputMode="numeric" value={pinRaw}
                onChange={e => setPinRaw(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="•••• (optionnel)" />
              <p className="text-xs text-gray-400 mt-1">Votre code d&apos;accès à la caisse (stocké de façon sécurisée)</p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-xa-primary text-white font-semibold rounded-xl py-3 mt-2 hover:bg-xa-primary/90 transition disabled:opacity-50">
              {loading ? 'Création...' : 'Créer la boutique'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
