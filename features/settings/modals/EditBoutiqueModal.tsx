'use client';

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Boutique } from '@/types/database';

type EditBoutiqueModalProps = {
  boutique: Boutique;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

export default function EditBoutiqueModal({ boutique, onClose, onSaved, onDeleted }: EditBoutiqueModalProps) {
  const [nom, setNom] = useState(boutique.nom);
  const [whatsapp, setWhatsapp] = useState(boutique.telephone_whatsapp ?? '');
  const [adresse, setAdresse] = useState(boutique.adresse ?? '');
  const [zone, setZone] = useState(boutique.zone ?? boutique.ville ?? '');
  const [horaires, setHoraires] = useState(
    typeof boutique.horaires === 'object' && boutique.horaires
      ? JSON.stringify(boutique.horaires, null, 2)
      : '',
  );
  const [couleur, setCouleur] = useState(boutique.couleur ?? boutique.couleur_theme ?? '#1DDB7B');
  const [estActif, setEstActif] = useState(boutique.est_actif !== false);
  const [cataloguePublic, setCataloguePublic] = useState(boutique.catalogue_public ?? false);
  const [loading, setLoading] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    let parsedHoraires: Record<string, string | null> | undefined;
    if (horaires.trim()) {
      try {
        parsedHoraires = JSON.parse(horaires) as Record<string, string | null>;
      } catch {
        setMsg({ type: 'error', text: 'Format JSON invalide pour les horaires.' });
        setLoading(false);
        return;
      }
    }

    const res = await fetch(`/api/settings/boutiques/${boutique.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: nom.trim(),
        telephone_whatsapp: whatsapp.trim() || null,
        adresse: adresse.trim() || null,
        zone: zone.trim() || null,
        couleur,
        est_actif: estActif,
        catalogue_public: cataloguePublic,
        horaires: parsedHoraires ?? null,
      }),
    });

    const data = (await res.json()) as { ok?: boolean; boutique?: unknown; error?: string };
    setLoading(false);

    if (!res.ok) {
      setMsg({ type: 'error', text: data.error ?? 'Erreur lors de la mise à jour.' });
    } else {
      setMsg({ type: 'success', text: 'Boutique mise à jour.' });
      setTimeout(onSaved, 800);
    }
  }

  async function handleDeactivate() {
    if (!window.confirm(`Désactiver la boutique "${boutique.nom}" ?`)) return;
    setDeactivating(true);
    const res = await fetch(`/api/settings/boutiques/${boutique.id}`, {
      method: 'DELETE',
    });
    setDeactivating(false);
    if (res.ok) {
      onDeleted();
    } else {
      const data = (await res.json()) as { error?: string };
      setMsg({ type: 'error', text: data.error ?? 'Erreur lors de la désactivation.' });
    }
  }

  return (
    <div className="xa-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="xa-modal-box" role="dialog" aria-modal="true" aria-label="Modifier la boutique">
        <div className="xa-modal-header">
          <h3 className="text-base font-semibold text-xa-text truncate">Modifier : {boutique.nom}</h3>
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
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Horaires (JSON, optionnel)
            </label>
            <textarea
              value={horaires}
              onChange={(e) => setHoraires(e.target.value)}
              rows={3}
              placeholder={'{"lundi":"08:00-18:00","dimanche":null}'}
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm font-mono focus:outline-none focus:ring-2 focus:ring-xa-primary resize-none"
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

          <div className="flex items-center justify-between py-1">
            <label className="text-sm text-xa-text">Boutique active</label>
            <button
              type="button"
              onClick={() => setEstActif((v) => !v)}
              className="relative inline-flex h-5 w-9 rounded-full transition-colors duration-200"
              style={{ background: estActif ? 'var(--xa-primary)' : 'var(--xa-border)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: estActif ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="text-sm text-xa-text">Catalogue public</label>
            <button
              type="button"
              onClick={() => setCataloguePublic((v) => !v)}
              className="relative inline-flex h-5 w-9 rounded-full transition-colors duration-200"
              style={{ background: cataloguePublic ? 'var(--xa-primary)' : 'var(--xa-border)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: cataloguePublic ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={deactivating}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--xa-danger)', color: 'var(--xa-danger)' }}
            >
              <Trash2 size={14} />
              {deactivating ? '…' : 'Désactiver'}
            </button>
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
              {loading ? 'Sauvegarde…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
