'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { hashPin } from '@/lib/pinHash';
import type { Boutique, BoutiqueUpdate } from '@/types/database';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ParametresPage() {
  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nom: '', adresse: '', telephone: '', ville: '', newPin: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('boutiques').select('*').eq('proprietaire_id', user.id).eq('actif', true).single();
      if (data) {
        setBoutique(data);
        setForm({ nom: data.nom, adresse: data.adresse ?? '', telephone: data.telephone ?? '', ville: data.ville ?? '', newPin: '' });
      }
      setLoading(false);
    }
    load();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!boutique) return;
    setSaving(true); setError(''); setSuccess('');

    const updates: BoutiqueUpdate = {
      nom: form.nom,
      adresse: form.adresse || null,
      telephone: form.telephone || null,
      ville: form.ville || null,
    };

    if (form.newPin) {
      if (form.newPin.length < 4) { setError('PIN minimum 4 chiffres.'); setSaving(false); return; }
      updates.pin_caisse = await hashPin(form.newPin);
    }

    const supabase = createClient();
    const { error: dbErr } = await supabase.from('boutiques').update(updates).eq('id', boutique.id);
    if (dbErr) { setError(dbErr.message); } else { setSuccess('Paramètres enregistrés !'); }
    setSaving(false);
  }

  if (loading) return <p className="text-center text-gray-400 py-20">Chargement…</p>;

  return (
    <main className="min-h-screen bg-xa-bg px-4 py-6 max-w-sm mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href="/dashboard" className="text-xa-primary text-xl">←</a>
        <h1 className="text-lg font-bold text-xa-primary">Paramètres</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-xa-danger/30 text-xa-danger text-sm rounded-xl p-3">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3">{success}</div>}

          {[
            { name: 'nom', label: 'Nom de la boutique', required: true },
            { name: 'ville', label: 'Ville', required: false },
            { name: 'adresse', label: 'Adresse', required: false },
            { name: 'telephone', label: 'Téléphone', required: false },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type="text"
                name={field.name}
                required={field.required}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau PIN caisse (laisser vide pour ne pas changer)</label>
            <input
              type="password"
              name="newPin"
              inputMode="numeric"
              pattern="[0-9]{4,8}"
              value={form.newPin}
              onChange={handleChange}
              placeholder="••••"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
            />
          </div>

          {boutique && (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
              Code unique boutique : <span className="font-mono font-bold text-gray-600">{boutique.code_unique}</span>
            </div>
          )}

          <Button type="submit" className="w-full" loading={saving}>Enregistrer</Button>
        </form>
      </Card>
    </main>
  );
}
