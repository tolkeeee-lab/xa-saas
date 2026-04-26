'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { EffectiveRole } from '@/lib/auth/getEffectiveRole';

type AddBoutiqueModalProps = {
  role: EffectiveRole;
  onClose: () => void;
  onSaved: () => void;
};

export default function AddBoutiqueModal({ onClose, onSaved }: AddBoutiqueModalProps) {
  const [nom, setNom] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [adresse, setAdresse] = useState('');
  const [zone, setZone] = useState('');
  const [couleur, setCouleur] = useState('#1DDB7B');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    if (!nom.trim()) {
      setMsg({ type: 'error', text: 'Le nom est obligatoire.' });
      return;
    }

    setLoading(true);
    const res = await fetch('/api/settings/boutiques', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: nom.trim(),
        telephone_whatsapp: whatsapp.trim() || undefined,
        adresse: adresse.trim() || undefined,
        zone: zone.trim() || undefined,
        couleur,
      }),
    });

    const data = (await res.json()) as { ok?: boolean; boutique?: unknown; error?: string };
    setLoading(false);

    if (!res.ok) {
      setMsg({ type: 'error', text: data.error ?? 'Erreur lors de la création.' });
    } else {
      setMsg({ type: 'success', text: 'Boutique créée !' });
      setTimeout(onSaved, 800);
    }
  }

  return (
    <div className="xa-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="xa-modal-box" role="dialog" aria-modal="true" aria-label="Ajouter une boutique">
        <div className="xa-modal-header">
          <h3 className="text-base font-semibold text-xa-text">Ajouter une boutique</h3>
          <button type="button" onClick={onClose} className="xa-modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="xa-modal-body space-y-4">
          {msg && (
            <div
              className={`p-3 rounded-lg text-sm border ${
                msg.type === 'success'
                  ? 'border-xa-green text-xa-green'
                  : 'border-xa-danger text-xa-danger'
              }`}
            >
              {msg.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Nom <span style={{ color: 'var(--xa-danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Téléphone WhatsApp
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+229 …"
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">Adresse</label>
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">Zone / Ville</label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">Couleur</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={couleur}
                onChange={(e) => setCouleur(e.target.value)}
                className="w-12 h-10 rounded-lg border border-xa-border cursor-pointer bg-xa-bg"
              />
              <span className="text-sm font-mono text-xa-muted">{couleur}</span>
              <div
                className="w-8 h-8 rounded-lg border border-xa-border"
                style={{ backgroundColor: couleur }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg2 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--xa-primary)' }}
            >
              {loading ? 'Création…' : 'Créer la boutique'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
