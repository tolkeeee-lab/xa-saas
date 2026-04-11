'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { hashPin } from '@/lib/pinHash';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function NewBoutiquePage() {
  const router = useRouter();
  const [form, setForm] = useState({ nom: '', adresse: '', telephone: '', ville: '', pinCaisse: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.pinCaisse.length < 4) { setError('PIN minimum 4 chiffres.'); return; }
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Non connecté.'); setLoading(false); return; }

    const pinHash = await hashPin(form.pinCaisse);
    const codeUnique = Math.random().toString(36).slice(2, 8).toUpperCase();

    const { error: dbErr } = await supabase.from('boutiques').insert({
      nom: form.nom,
      adresse: form.adresse || null,
      telephone: form.telephone || null,
      ville: form.ville || null,
      proprietaire_id: user.id,
      code_unique: codeUnique,
      pin_caisse: pinHash,
      actif: true,
    });

    if (dbErr) { setError(dbErr.message); } else { router.push('/dashboard'); }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-xa-bg px-4 py-6 max-w-sm mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href="/dashboard" className="text-xa-primary text-xl">←</a>
        <h1 className="text-lg font-bold text-xa-primary">Nouvelle boutique</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-xa-danger/30 text-xa-danger text-sm rounded-xl p-3">{error}</div>
          )}

          {[
            { name: 'nom', label: 'Nom de la boutique', required: true, placeholder: 'Épicerie du coin' },
            { name: 'ville', label: 'Ville', required: false, placeholder: 'Dakar' },
            { name: 'adresse', label: 'Adresse', required: false, placeholder: 'Rue 10, HLM' },
            { name: 'telephone', label: 'Téléphone', required: false, placeholder: '+221 77 000 00 00' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type="text"
                name={field.name}
                required={field.required}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN caisse (4+ chiffres)</label>
            <input
              type="password"
              name="pinCaisse"
              required
              inputMode="numeric"
              pattern="[0-9]{4,8}"
              value={form.pinCaisse}
              onChange={handleChange}
              placeholder="••••"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
            />
          </div>

          <Button type="submit" className="w-full" loading={loading}>Créer la boutique</Button>
        </form>
      </Card>
    </main>
  );
}
