'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { hashPin } from '@/lib/pinHash';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { Employe, EmployeRole } from '@/types/database';

export default function EmployesPage() {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', pin: '', role: 'caissier' as EmployeRole });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: boutique } = await supabase.from('boutiques').select('id').eq('proprietaire_id', user.id).eq('actif', true).single();
      if (!boutique) { setLoading(false); return; }
      setBoutiqueId(boutique.id);
      const { data } = await supabase.from('employes').select('*').eq('boutique_id', boutique.id).eq('actif', true).order('nom');
      setEmployes(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!boutiqueId) return;
    if (form.pin.length < 4) { setError('PIN minimum 4 chiffres.'); return; }
    setSaving(true); setError('');

    const pinHash = await hashPin(form.pin);
    const supabase = createClient();
    const { error: dbErr, data } = await supabase.from('employes').insert({
      boutique_id: boutiqueId,
      nom: form.nom,
      prenom: form.prenom || null,
      telephone: form.telephone || null,
      pin: pinHash,
      role: form.role,
      actif: true,
    }).select().single();

    if (dbErr) { setError(dbErr.message); } else if (data) {
      setEmployes(prev => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)));
      setShowForm(false);
      setForm({ nom: '', prenom: '', telephone: '', pin: '', role: 'caissier' });
    }
    setSaving(false);
  }

  const roleLabel: Record<EmployeRole, string> = { caissier: 'Caissier', gerant: 'Gérant', admin: 'Admin' };

  return (
    <main className="min-h-screen bg-xa-bg px-4 py-6 max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-xa-primary text-xl">←</a>
          <h1 className="text-lg font-bold text-xa-primary">Employés</h1>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)}>+ Ajouter</Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="text-xa-danger text-sm">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Nom *</label>
              <input type="text" name="nom" required value={form.nom} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Prénom</label>
              <input type="text" name="prenom" value={form.prenom} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Téléphone</label>
              <input type="tel" name="telephone" value={form.telephone} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">PIN (4+ chiffres) *</label>
              <input type="password" name="pin" required inputMode="numeric" pattern="[0-9]{4,8}" value={form.pin} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Rôle</label>
              <select name="role" value={form.role} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary/30">
                <option value="caissier">Caissier</option>
                <option value="gerant">Gérant</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1" loading={saving}>Enregistrer</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-8">Chargement…</p>
      ) : employes.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Aucun employé.</p>
      ) : (
        <div className="space-y-2">
          {employes.map(emp => (
            <Card key={emp.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-gray-900">{emp.nom} {emp.prenom}</p>
                <p className="text-xs text-gray-500">{emp.telephone ?? '—'}</p>
              </div>
              <span className="text-xs bg-xa-primary/10 text-xa-primary px-2 py-0.5 rounded-full font-medium">
                {roleLabel[emp.role]}
              </span>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
