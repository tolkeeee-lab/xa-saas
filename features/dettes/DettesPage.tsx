'use client';

import { useState } from 'react';
import type { Boutique } from '@/types/database';
import type { DettesData, DetteAvecBoutique } from '@/lib/supabase/getDettes';
import { formatFCFA, formatDate } from '@/lib/format';
import StatCard from '@/components/ui/StatCard';

interface DettesPageProps {
  data: DettesData;
  boutiques: Boutique[];
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    en_attente: 'bg-powder-petal-500/20 text-powder-petal-400',
    paye: 'bg-aquamarine-500/20 text-aquamarine-500',
    en_retard: 'bg-xa-danger/20 text-xa-danger',
  };
  const label: Record<string, string> = {
    en_attente: 'En attente',
    paye: 'Payé',
    en_retard: 'En retard',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[statut] ?? 'bg-xa-bg text-xa-muted'}`}>
      {label[statut] ?? statut}
    </span>
  );
}

interface NouvelleDetteModalProps {
  boutiques: Boutique[];
  onClose: () => void;
  onCreated: () => void;
}

function NouvelleDetteModal({ boutiques, onClose, onCreated }: NouvelleDetteModalProps) {
  const [boutique_id, setBoutiqueId] = useState(boutiques[0]?.id ?? '');
  const [client_nom, setClientNom] = useState('');
  const [client_telephone, setClientTelephone] = useState('');
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [date_echeance, setDateEcheance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const montantNum = parseInt(montant, 10);
    if (!boutique_id || !client_nom.trim() || isNaN(montantNum) || montantNum <= 0) {
      setError('Boutique, nom client et montant sont obligatoires');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dettes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id,
          client_nom,
          client_telephone: client_telephone || undefined,
          montant: montantNum,
          description: description || undefined,
          date_echeance: date_echeance || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Erreur');
        return;
      }
      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-xa-surface border border-xa-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-xa-text">Nouvelle dette client</h2>
          <button onClick={onClose} className="text-xa-muted hover:text-xa-text">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-xa-muted mb-1 block">Boutique *</label>
            <select
              value={boutique_id}
              onChange={(e) => setBoutiqueId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            >
              {boutiques.map((b) => (
                <option key={b.id} value={b.id}>{b.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-xa-muted mb-1 block">Nom client *</label>
            <input
              value={client_nom}
              onChange={(e) => setClientNom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              placeholder="Nom du client"
            />
          </div>
          <div>
            <label className="text-xs text-xa-muted mb-1 block">Téléphone</label>
            <input
              value={client_telephone}
              onChange={(e) => setClientTelephone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              placeholder="+229…"
            />
          </div>
          <div>
            <label className="text-xs text-xa-muted mb-1 block">Montant (FCFA) *</label>
            <input
              type="number"
              min="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-xa-muted mb-1 block">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              placeholder="Produits achetés…"
            />
          </div>
          <div>
            <label className="text-xs text-xa-muted mb-1 block">Date d&apos;échéance</label>
            <input
              type="date"
              value={date_echeance}
              onChange={(e) => setDateEcheance(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>
          {error && <p className="text-xa-danger text-xs">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DettesPage({ data: initialData, boutiques }: DettesPageProps) {
  const [dettes, setDettes] = useState<DetteAvecBoutique[]>(initialData.dettes);
  const [total_du, setTotalDu] = useState(initialData.total_du);
  const [en_retard, setEnRetard] = useState(initialData.en_retard);
  const [recuperees_ce_mois] = useState(initialData.recuperees_ce_mois);
  const [showNouvelle, setShowNouvelle] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  async function marquerPaye(dette: DetteAvecBoutique) {
    setMarkingPaid(dette.id);
    try {
      const res = await fetch(`/api/dettes/${dette.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'paye' }),
      });
      if (res.ok) {
        const updated = dettes.map((d) =>
          d.id === dette.id ? { ...d, statut: 'paye' as const } : d,
        );
        setDettes(updated);
        const newTotalDu = updated
          .filter((d) => d.statut !== 'paye')
          .reduce((s, d) => s + (d.montant - d.montant_rembourse), 0);
        const newEnRetard = updated.filter((d) => d.statut === 'en_retard').length;
        setTotalDu(newTotalDu);
        setEnRetard(newEnRetard);
      }
    } finally {
      setMarkingPaid(null);
    }
  }

  async function refresh() {
    const res = await fetch('/api/dettes');
    if (res.ok) {
      const updated: DetteAvecBoutique[] = await res.json();
      setDettes(updated);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-xa-text">Dettes clients</h1>
          <p className="text-xa-muted text-sm mt-1">Suivi des créances réseau</p>
        </div>
        <button
          onClick={() => setShowNouvelle(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Nouvelle dette
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total dû réseau"
          value={formatFCFA(total_du)}
          subtitle="Créances en cours"
          accent
        />
        <StatCard
          title="Dettes en retard"
          value={en_retard}
          subtitle="À recouvrer d'urgence"
        />
        <StatCard
          title="Recouvrées ce mois"
          value={formatFCFA(recuperees_ce_mois)}
          subtitle="Payées ce mois"
        />
      </div>

      {/* Table */}
      <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
        {dettes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xa-muted">Aucune dette enregistrée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border text-xs text-xa-muted uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-4 py-3">Boutique</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-right px-4 py-3">Montant dû</th>
                  <th className="text-left px-4 py-3">Échéance</th>
                  <th className="text-left px-4 py-3">Statut</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dettes.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-xa-border last:border-0 hover:bg-xa-bg/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-xa-text">{d.client_nom}</p>
                      {d.client_telephone && (
                        <p className="text-xs text-xa-muted">{d.client_telephone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: d.boutique_couleur }}
                        />
                        <span className="text-xa-text">{d.boutique_nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xa-muted max-w-[200px] truncate">
                      {d.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-xa-text">
                      {formatFCFA(d.montant - d.montant_rembourse)}
                    </td>
                    <td className="px-4 py-3 text-xa-muted text-xs">
                      {d.date_echeance ? formatDate(d.date_echeance) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={d.statut} />
                    </td>
                    <td className="px-4 py-3">
                      {d.statut !== 'paye' && (
                        <button
                          onClick={() => marquerPaye(d)}
                          disabled={markingPaid === d.id}
                          className="px-3 py-1.5 rounded-lg bg-aquamarine-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {markingPaid === d.id ? '…' : 'Marquer payé'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNouvelle && (
        <NouvelleDetteModal
          boutiques={boutiques}
          onClose={() => setShowNouvelle(false)}
          onCreated={refresh}
        />
      )}
    </div>
  );
}
