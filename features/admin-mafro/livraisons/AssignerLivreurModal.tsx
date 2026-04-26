'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { CommandeB2B, Livraison } from '@/types/database';

type CommandeMinimal = Pick<CommandeB2B, 'id' | 'numero' | 'statut' | 'boutique_id' | 'total'>;

type Props = {
  commandesPrets: CommandeMinimal[];
  onClose: () => void;
  onSuccess: (livraison: Livraison) => void;
};

export default function AssignerLivreurModal({ commandesPrets, onClose, onSuccess }: Props) {
  const [commandeId, setCommandeId] = useState('');
  const [chauffeur, setChauffeur] = useState('');
  const [vehicule, setVehicule] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandeId || !chauffeur) {
      setError('Commande et chauffeur sont requis');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin-mafro/livraisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commande_b2b_id: commandeId, chauffeur, vehicule, note }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erreur serveur');
      }
      const data = await res.json();
      onSuccess(data.livraison as Livraison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="xa-modal-overlay" onClick={onClose}>
      <div className="xa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="xa-modal__header">
          <h2 className="xa-modal__title">Dispatcher une livraison</h2>
          <button onClick={onClose} className="xa-modal__close"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="xa-modal__body">
          {error && <div className="xa-error-banner">{error}</div>}

          <div className="xa-form-group">
            <label className="xa-label" htmlFor="commande-select">Commande préparée *</label>
            <select
              id="commande-select"
              className="xa-select"
              value={commandeId}
              onChange={(e) => setCommandeId(e.target.value)}
              required
            >
              <option value="">Sélectionner…</option>
              {commandesPrets.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.numero} — {c.total.toLocaleString('fr-FR')} FCFA
                </option>
              ))}
            </select>
          </div>

          <div className="xa-form-group">
            <label className="xa-label" htmlFor="chauffeur-input">Chauffeur *</label>
            <input
              id="chauffeur-input"
              className="xa-input"
              type="text"
              value={chauffeur}
              onChange={(e) => setChauffeur(e.target.value)}
              placeholder="Nom du chauffeur"
              required
            />
          </div>

          <div className="xa-form-group">
            <label className="xa-label" htmlFor="vehicule-input">Véhicule</label>
            <input
              id="vehicule-input"
              className="xa-input"
              type="text"
              value={vehicule}
              onChange={(e) => setVehicule(e.target.value)}
              placeholder="Ex: Moto 125 — AB-1234"
            />
          </div>

          <div className="xa-form-group">
            <label className="xa-label" htmlFor="note-input">Note</label>
            <textarea
              id="note-input"
              className="xa-input xa-input--textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Instructions particulières…"
              rows={3}
            />
          </div>

          <div className="xa-modal__footer">
            <button type="button" onClick={onClose} className="xa-btn xa-btn--ghost">
              Annuler
            </button>
            <button type="submit" className="xa-btn xa-btn--primary" disabled={loading}>
              {loading ? 'Création…' : 'Créer et assigner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
