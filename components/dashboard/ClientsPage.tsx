'use client';

import { useState, useMemo, useCallback } from 'react';
import { formatFCFA } from '@/lib/format';
import type { Client } from '@/types/database';
import type { ClientsData } from '@/lib/supabase/getClients';

interface ClientsPageProps {
  data: ClientsData;
}

type ModalMode = 'create' | 'edit';

interface ModalState {
  mode: ModalMode;
  client?: Client;
}

function PointsBadge({ points }: { points: number }) {
  if (points >= 100) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
        {points} pts 🎁
      </span>
    );
  }
  if (points >= 50) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400">
        {points} pts
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-xa-border text-xa-muted">
      {points} pts
    </span>
  );
}

function RemiseCell({ points }: { points: number }) {
  if (points >= 100) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
        ✓ 5% dispo
      </span>
    );
  }
  const pct = Math.min(100, Math.round((points / 100) * 100));
  return (
    <div className="w-24">
      <div className="h-1.5 rounded-full bg-xa-border overflow-hidden">
        <div className="h-full bg-xa-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-xa-muted mt-0.5">{points} / 100 pts</p>
    </div>
  );
}

export default function ClientsPage({ data: initialData }: ClientsPageProps) {
  const [clients, setClients] = useState<Client[]>(initialData.clients);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState | null>(null);
  const [formNom, setFormNom] = useState('');
  const [formTel, setFormTel] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) || (c.telephone ?? '').includes(q),
    );
  }, [clients, search]);

  const stats = useMemo(() => ({
    total_clients: clients.length,
    clients_avec_remise: clients.filter((c) => c.points >= 100).length,
    total_points_reseau: clients.reduce((s, c) => s + c.points, 0),
  }), [clients]);

  function openCreate() {
    setFormNom('');
    setFormTel('');
    setModal({ mode: 'create' });
  }

  function openEdit(client: Client) {
    setFormNom(client.nom);
    setFormTel(client.telephone ?? '');
    setModal({ mode: 'edit', client });
  }

  function closeModal() {
    setModal(null);
  }

  async function handleSubmit() {
    if (!formNom.trim()) {
      showToast('Le nom est obligatoire', 'error');
      return;
    }
    setSaving(true);
    try {
      if (modal?.mode === 'create') {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: formNom.trim(), telephone: formTel.trim() || null }),
        });
        const result = await res.json() as Client | { error: string };
        if (!res.ok) {
          showToast(('error' in result ? result.error : null) ?? 'Erreur', 'error');
          return;
        }
        setClients((prev) => [result as Client, ...prev]);
        showToast('Client créé avec succès', 'success');
      } else if (modal?.mode === 'edit' && modal.client) {
        const res = await fetch(`/api/clients/${modal.client.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: formNom.trim(), telephone: formTel.trim() || null }),
        });
        const result = await res.json() as Client | { error: string };
        if (!res.ok) {
          showToast(('error' in result ? result.error : null) ?? 'Erreur', 'error');
          return;
        }
        setClients((prev) => prev.map((c) => (c.id === (result as Client).id ? (result as Client) : c)));
        showToast('Client modifié avec succès', 'success');
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const result = await res.json() as { error?: string };
        showToast(result.error ?? 'Erreur lors de la suppression', 'error');
        return;
      }
      setClients((prev) => prev.filter((c) => c.id !== id));
      showToast('Client supprimé', 'success');
    } finally {
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg font-semibold text-sm text-white shadow-lg"
          style={{ background: toast.type === 'success' ? '#00d68f' : '#ff3341' }}
        >
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-xa-text">👥 Clients fidèles</h1>
          <p className="text-sm text-xa-muted mt-0.5">Gérez vos clients et leur programme de fidélité</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-xa-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Nouveau client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs text-xa-muted font-semibold uppercase tracking-wider mb-1">Total clients</p>
          <p className="text-3xl font-bold text-xa-primary">{stats.total_clients}</p>
        </div>
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs text-xa-muted font-semibold uppercase tracking-wider mb-1">Remise débloquée</p>
          <p className="text-3xl font-bold" style={{ color: '#17e8bb' }}>{stats.clients_avec_remise}</p>
          <p className="text-xs text-xa-muted mt-0.5">Points ≥ 100</p>
        </div>
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs text-xa-muted font-semibold uppercase tracking-wider mb-1">Points réseau</p>
          <p className="text-3xl font-bold" style={{ color: '#f5740a' }}>{stats.total_points_reseau}</p>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="🔍 Rechercher par nom ou téléphone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
        />
      </div>

      {/* Table */}
      {filteredClients.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-10 text-center">
          <p className="text-xa-muted text-sm">
            {clients.length === 0
              ? "Aucun client enregistré. Ajoutez votre premier client depuis la caisse ou manuellement."
              : "Aucun client ne correspond à la recherche."}
          </p>
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">Points</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">Total achats</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">Visites</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">Remise</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-xa-text">{client.nom}</p>
                      {client.telephone && (
                        <p className="text-xs text-xa-muted">{client.telephone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PointsBadge points={client.points} />
                    </td>
                    <td className="px-4 py-3 text-xa-text font-medium">
                      {formatFCFA(client.total_achats)}
                    </td>
                    <td className="px-4 py-3 text-xa-text">
                      {client.nb_visites}
                    </td>
                    <td className="px-4 py-3">
                      <RemiseCell points={client.points} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(client)}
                          className="text-xs px-2.5 py-1 rounded-md border border-xa-border text-xa-text hover:bg-xa-bg transition-colors"
                        >
                          Modifier
                        </button>
                        {confirmDeleteId === client.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(client.id)}
                              className="text-xs px-2.5 py-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2.5 py-1 rounded-md border border-xa-border text-xa-muted hover:bg-xa-bg transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(client.id)}
                            className="text-xs px-2.5 py-1 rounded-md text-xa-danger hover:bg-xa-bg transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-xa-surface border border-xa-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-xa-text mb-4">
              {modal.mode === 'create' ? '➕ Nouveau client' : '✏️ Modifier le client'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-xa-muted block mb-1">Nom *</label>
                <input
                  type="text"
                  placeholder="Nom du client"
                  value={formNom}
                  onChange={(e) => setFormNom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-xa-muted block mb-1">Téléphone</label>
                <input
                  type="text"
                  placeholder="+229 00 00 00 00"
                  value={formTel}
                  onChange={(e) => setFormTel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={closeModal}
                className="flex-1 py-2 rounded-lg border border-xa-border text-xa-text text-sm font-medium hover:bg-xa-bg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {saving ? 'Enregistrement…' : modal.mode === 'create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
