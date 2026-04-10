'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase-browser';
import { hashPin } from '../../../lib/pinHash';
import type { Boutique, Employe, EmployeRole } from '../../../types/database';

export default function ParametresPage() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [employes, setEmployes] = useState<Record<string, Employe[]>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Code unique form
  const [codeUnique, setCodeUnique] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeMsg, setCodeMsg] = useState<string | null>(null);

  // PIN caisse form
  const [pinCaisse, setPinCaisse] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMsg, setPinMsg] = useState<string | null>(null);

  // Employe add forms per boutique
  const [addForms, setAddForms] = useState<Record<string, { nom: string; prenom: string; pin: string; role: EmployeRole }>>({});
  const [addMsgs, setAddMsgs] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: bData } = await supabase
        .from('boutiques')
        .select('*')
        .eq('proprietaire_id', user.id)
        .eq('actif', true)
        .order('created_at');
      const bList = bData ?? [];
      setBoutiques(bList);
      if (bList.length > 0) {
        setCodeUnique(bList[0].code_unique ?? '');
      }

      const empMap: Record<string, Employe[]> = {};
      const formMap: Record<string, { nom: string; prenom: string; pin: string; role: EmployeRole }> = {};
      for (const b of bList) {
        const { data: eData } = await supabase
          .from('employes')
          .select('*')
          .eq('boutique_id', b.id)
          .eq('actif', true)
          .order('nom');
        empMap[b.id] = eData ?? [];
        formMap[b.id] = { nom: '', prenom: '', pin: '', role: 'caissier' };
      }
      setEmployes(empMap);
      setAddForms(formMap);
      setLoading(false);
    };
    void load();
  }, []);

  const handleCodeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeMsg(null);
    if (!/^[A-Z0-9]{4,}$/.test(codeUnique.toUpperCase().trim())) {
      setCodeMsg('Le code doit contenir au moins 4 caractères alphanumériques');
      return;
    }
    setCodeLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('boutiques')
      .update({ code_unique: codeUnique.toUpperCase().trim() })
      .eq('proprietaire_id', userId!)
      .eq('id', boutiques[0].id);
    setCodeLoading(false);
    if (error) {
      const msg = error.message.includes('unique') || error.code === '23505'
        ? 'Ce code est déjà utilisé, veuillez en choisir un autre'
        : `Erreur : ${error.message}`;
      setCodeMsg(msg);
    } else {
      setCodeMsg('Code mis à jour ✓');
    }
  };

  const handlePinUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);
    if (!/^\d{4}$/.test(pinCaisse)) {
      setPinMsg('Le PIN doit être exactement 4 chiffres');
      return;
    }
    setPinLoading(true);
    const pinHash = await hashPin(pinCaisse);
    const supabase = createClient();
    const { error } = await supabase
      .from('boutiques')
      .update({ pin_caisse: pinHash })
      .eq('proprietaire_id', userId!)
      .eq('id', boutiques[0].id);
    setPinLoading(false);
    setPinMsg(error ? `Erreur : ${error.message}` : 'PIN mis à jour ✓');
    if (!error) setPinCaisse('');
  };

  const handleSoftDelete = async (boutiqueId: string, employeId: string) => {
    const supabase = createClient();
    await supabase
      .from('employes')
      .update({ actif: false })
      .eq('id', employeId);
    setEmployes(prev => ({
      ...prev,
      [boutiqueId]: (prev[boutiqueId] ?? []).filter(e => e.id !== employeId),
    }));
  };

  const handleAddEmploye = async (e: React.FormEvent, boutiqueId: string) => {
    e.preventDefault();
    const form = addForms[boutiqueId];
    if (!form) return;
    setAddMsgs(prev => ({ ...prev, [boutiqueId]: null }));
    if (!form.nom.trim()) {
      setAddMsgs(prev => ({ ...prev, [boutiqueId]: 'Le nom est requis' }));
      return;
    }
    if (form.pin && !/^\d{4}$/.test(form.pin)) {
      setAddMsgs(prev => ({ ...prev, [boutiqueId]: 'Le PIN doit être 4 chiffres' }));
      return;
    }
    const supabase = createClient();
    const pinHash = form.pin ? await hashPin(form.pin) : null;
    const { data, error } = await supabase
      .from('employes')
      .insert({
        boutique_id: boutiqueId,
        nom: form.nom.trim(),
        prenom: form.prenom.trim() || null,
        telephone: null,
        pin: pinHash,
        role: form.role,
        actif: true,
      })
      .select()
      .single();
    if (error || !data) {
      setAddMsgs(prev => ({ ...prev, [boutiqueId]: `Erreur : ${error?.message}` }));
      return;
    }
    setEmployes(prev => ({ ...prev, [boutiqueId]: [...(prev[boutiqueId] ?? []), data] }));
    setAddForms(prev => ({ ...prev, [boutiqueId]: { nom: '', prenom: '', pin: '', role: 'caissier' } }));
    setAddMsgs(prev => ({ ...prev, [boutiqueId]: 'Employé ajouté ✓' }));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-xa-bg flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-xa-bg p-6">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-gray-400">← Dashboard</Link>
          <h1 className="text-xl font-bold text-gray-800">Paramètres</h1>
        </div>

        {/* Section 1 — Code unique */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-1">Code unique</h2>
          <p className="text-xs text-gray-400 mb-4">Partagez ce code avec vos employés pour qu&apos;ils accèdent à la caisse.</p>
          <form onSubmit={handleCodeUpdate} className="space-y-3">
            <input
              type="text"
              value={codeUnique}
              onChange={e => setCodeUnique(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              required
              minLength={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-xa-primary bg-white"
              placeholder="ex: DUPONT42"
            />
            {codeMsg && <p className={`text-sm ${codeMsg.startsWith('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{codeMsg}</p>}
            <button type="submit" disabled={codeLoading}
              className="w-full bg-xa-primary text-white font-semibold rounded-xl py-2.5 hover:bg-xa-primary/90 transition disabled:opacity-50 text-sm">
              {codeLoading ? 'Enregistrement...' : 'Mettre à jour le code'}
            </button>
          </form>
        </div>

        {/* Section 2 — PIN caisse */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-1">PIN caisse (propriétaire)</h2>
          <p className="text-xs text-gray-400 mb-4">Votre code PIN à 4 chiffres pour accéder à la caisse.</p>
          <form onSubmit={handlePinUpdate} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              value={pinCaisse}
              onChange={e => setPinCaisse(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
              maxLength={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
              placeholder="Nouveau PIN (4 chiffres)"
            />
            {pinMsg && <p className={`text-sm ${pinMsg.startsWith('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{pinMsg}</p>}
            <button type="submit" disabled={pinLoading}
              className="w-full bg-xa-primary text-white font-semibold rounded-xl py-2.5 hover:bg-xa-primary/90 transition disabled:opacity-50 text-sm">
              {pinLoading ? 'Enregistrement...' : 'Mettre à jour le PIN'}
            </button>
          </form>
        </div>

        {/* Section 3 — Boutiques */}
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Mes boutiques</h2>
            <Link href="/dashboard/boutiques/new" className="text-sm text-xa-primary font-medium">+ Ajouter</Link>
          </div>
          {boutiques.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-2">Aucune boutique</p>
          ) : (
            <div className="space-y-2">
              {boutiques.map(b => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{b.nom}</p>
                    {b.ville && <p className="text-xs text-gray-400">{b.ville}</p>}
                  </div>
                  <span className="text-xs font-mono text-gray-400">{b.code_unique ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4 — Employés par boutique */}
        {boutiques.map(b => (
          <div key={b.id} className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-700 mb-3">Employés — {b.nom}</h2>

            {/* List */}
            <div className="space-y-2 mb-4">
              {(employes[b.id] ?? []).length === 0 ? (
                <p className="text-gray-400 text-sm">Aucun employé actif</p>
              ) : (
                (employes[b.id] ?? []).map(emp => (
                  <div key={emp.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{emp.nom}{emp.prenom ? ` ${emp.prenom}` : ''}</p>
                      <p className="text-xs text-gray-400 capitalize">{emp.role}</p>
                    </div>
                    <button
                      onClick={() => void handleSoftDelete(b.id, emp.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition">
                      Retirer
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add form */}
            <form onSubmit={e => void handleAddEmploye(e, b.id)} className="space-y-2 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Ajouter un employé</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Nom *" value={addForms[b.id]?.nom ?? ''} onChange={e => setAddForms(prev => ({ ...prev, [b.id]: { ...prev[b.id]!, nom: e.target.value } }))}
                  required className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" />
                <input type="text" placeholder="Prénom" value={addForms[b.id]?.prenom ?? ''} onChange={e => setAddForms(prev => ({ ...prev, [b.id]: { ...prev[b.id]!, prenom: e.target.value } }))}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="password" inputMode="numeric" placeholder="PIN (4 chiffres)" value={addForms[b.id]?.pin ?? ''}
                  onChange={e => setAddForms(prev => ({ ...prev, [b.id]: { ...prev[b.id]!, pin: e.target.value.replace(/\D/g, '').slice(0, 4) } }))}
                  maxLength={4} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" />
                <select value={addForms[b.id]?.role ?? 'caissier'} onChange={e => setAddForms(prev => ({ ...prev, [b.id]: { ...prev[b.id]!, role: e.target.value as EmployeRole } }))}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white">
                  <option value="caissier">Caissier</option>
                  <option value="gerant">Gérant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {addMsgs[b.id] && <p className={`text-sm ${addMsgs[b.id]?.startsWith('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{addMsgs[b.id]}</p>}
              <button type="submit"
                className="w-full bg-xa-primary/10 text-xa-primary font-semibold rounded-xl py-2 text-sm hover:bg-xa-primary/20 transition">
                + Ajouter
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
