'use client';

import { useState } from 'react';
import type { Boutique } from '@/types/database';
import type { FournisseurAvecCommande } from '@/lib/supabase/getFournisseurs';
import { formatFCFA } from '@/lib/format';
import AddFournisseurModal from './AddFournisseurModal';
import CommandeModal from './CommandeModal';

interface FournisseursPageProps {
  fournisseurs: FournisseurAvecCommande[];
  boutiques: Boutique[];
}

function Etoiles({ note }: { note: number }) {
  return (
    <span className="text-sm">
      <span className="text-xa-accent">{'★'.repeat(note)}</span>
      <span className="text-xa-muted">{'☆'.repeat(5 - note)}</span>
    </span>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    en_attente: 'bg-orange-500/20 text-orange-400',
    en_cours: 'bg-xa-primary/20 text-xa-primary',
    recu: 'bg-green-500/20 text-green-400',
  };
  const label: Record<string, string> = {
    en_attente: 'En attente',
    en_cours: 'En cours',
    recu: 'Reçu',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[statut] ?? 'bg-xa-bg text-xa-muted'}`}>
      {label[statut] ?? statut}
    </span>
  );
}

export default function FournisseursPage({ fournisseurs: initial, boutiques }: FournisseursPageProps) {
  const [fournisseurs, setFournisseurs] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [commandeTarget, setCommandeTarget] = useState<FournisseurAvecCommande | null>(null);

  async function refresh() {
    const res = await fetch('/api/fournisseurs');
    if (res.ok) {
      const data = await res.json();
      setFournisseurs(data);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-xa-text">Fournisseurs</h1>
          <p className="text-xa-muted text-sm mt-1">Gérez vos fournisseurs et passez des commandes</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Ajouter fournisseur
        </button>
      </div>

      {/* Table */}
      <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
        {fournisseurs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xa-muted">Aucun fournisseur pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border text-xs text-xa-muted uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Fournisseur</th>
                  <th className="text-left px-4 py-3">Spécialité</th>
                  <th className="text-left px-4 py-3">Délai</th>
                  <th className="text-left px-4 py-3">Commande en cours</th>
                  <th className="text-left px-4 py-3">Total annuel</th>
                  <th className="text-left px-4 py-3">Note</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {fournisseurs.map((f) => (
                  <tr key={f.id} className="border-b border-xa-border last:border-0 hover:bg-xa-bg/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-xa-text">{f.nom}</p>
                      {f.telephone && (
                        <p className="text-xs text-xa-muted">{f.telephone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {f.specialite ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                          {f.specialite}
                        </span>
                      ) : (
                        <span className="text-xa-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xa-muted">
                      {f.delai_livraison ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {f.derniere_commande ? (
                        <div>
                          <p className="font-medium text-xa-text">
                            {formatFCFA(f.derniere_commande.montant)}
                          </p>
                          <StatutBadge statut={f.derniere_commande.statut} />
                        </div>
                      ) : (
                        <span className="text-xa-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-xa-text">
                      {f.total_annuel > 0 ? formatFCFA(f.total_annuel) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Etoiles note={f.note} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setCommandeTarget(f)}
                        className="px-3 py-1.5 rounded-lg bg-xa-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Commander
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddFournisseurModal
          onClose={() => setShowAdd(false)}
          onCreated={refresh}
        />
      )}

      {commandeTarget && (
        <CommandeModal
          fournisseur={commandeTarget}
          boutiques={boutiques}
          onClose={() => setCommandeTarget(null)}
          onCreated={refresh}
        />
      )}
    </div>
  );
}
