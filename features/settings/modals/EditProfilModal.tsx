'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { EffectiveRole } from '@/lib/auth/getEffectiveRole';

type EditProfilModalProps = {
  role: EffectiveRole;
  onClose: () => void;
  onSaved: (updated: { displayName?: string; whatsapp?: string | null }) => void;
};

export default function EditProfilModal({ role, onClose, onSaved }: EditProfilModalProps) {
  const [nom, setNom] = useState(role.displayName);
  const [whatsapp, setWhatsapp] = useState(role.whatsapp ?? '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const res = await fetch('/api/settings/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: nom.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
      }),
    });

    const data = (await res.json()) as { ok?: boolean; error?: string };
    setLoading(false);

    if (!res.ok) {
      setMsg({ type: 'error', text: data.error ?? 'Erreur lors de la mise à jour.' });
    } else {
      setMsg({ type: 'success', text: 'Profil mis à jour.' });
      onSaved({ displayName: nom.trim() || undefined, whatsapp: whatsapp.trim() || null });
    }
  }

  return (
    <div className="xa-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="xa-modal-box" role="dialog" aria-modal="true" aria-label="Modifier le profil">
        <div className="xa-modal-header">
          <h3 className="text-base font-semibold text-xa-text">Modifier le profil</h3>
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
              Nom complet
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={role.email}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg2 text-xa-muted text-sm cursor-not-allowed"
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
              {loading ? 'Sauvegarde…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
