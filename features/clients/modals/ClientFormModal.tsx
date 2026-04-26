'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Client } from '@/types/database';
import { PHONE_REGEX, isValidPhoneDigits } from '@/lib/schemas/clients';

type Props = {
  mode: 'create' | 'edit';
  client?: Client;
  onClose: () => void;
  onSaved: (client: Client) => void;
};

export default function ClientFormModal({ mode, client, onClose, onSaved }: Props) {
  const [nom, setNom] = useState(client?.nom ?? '');
  const [prenom, setPrenom] = useState(client?.prenom ?? '');
  const [telephone, setTelephone] = useState(client?.telephone ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [optIn, setOptIn] = useState(client?.opt_in_whatsapp ?? false);
  const [note, setNote] = useState(client?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setNom(client?.nom ?? '');
    setPrenom(client?.prenom ?? '');
    setTelephone(client?.telephone ?? '');
    setEmail(client?.email ?? '');
    setOptIn(client?.opt_in_whatsapp ?? false);
    setNote(client?.note ?? '');
    setErrors({});
  }, [client]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!nom.trim()) errs.nom = 'Le nom est requis';
    const tel = telephone.trim();
    if (tel && (!PHONE_REGEX.test(tel) || !isValidPhoneDigits(tel))) {
      errs.telephone = 'Format téléphone invalide (min. 7 chiffres)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        nom: nom.trim(),
        prenom: prenom.trim() || null,
        telephone: telephone.trim() || null,
        email: email.trim() || null,
        opt_in_whatsapp: optIn,
        note: note.trim() || null,
      };

      const url = mode === 'edit' && client ? `/api/clients/${client.id}` : '/api/clients';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await res.json()) as Client | { error: string };

      if (!res.ok) {
        setErrors({ general: ('error' in result ? result.error : null) ?? 'Erreur' });
        return;
      }
      onSaved(result as Client);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={(e: { target: EventTarget | null; currentTarget: EventTarget | null }) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-xa-surface border border-xa-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-xa-border">
          <h2 className="text-base font-bold text-xa-text">
            {mode === 'create' ? '➕ Nouveau client' : '✏️ Modifier le client'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xa-muted hover:text-xa-text p-1 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-xa-muted block mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Prénom"
                className="w-full px-3 py-2.5 rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-xa-muted block mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => {
                  setNom(e.target.value);
                  setErrors((prev: Record<string, string>) => ({ ...prev, nom: '' }));
                }}
                placeholder="Nom de famille"
                className={`w-full px-3 py-2.5 rounded-xl border text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary bg-xa-bg ${
                  errors.nom ? 'border-red-500' : 'border-xa-border'
                }`}
              />
              {errors.nom && <p className="text-xs text-red-500 mt-0.5">{errors.nom}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-xa-muted block mb-1">Téléphone</label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => {
                setTelephone(e.target.value);
                setErrors((prev: Record<string, string>) => ({ ...prev, telephone: '' }));
              }}
              placeholder="+229 00 00 00 00"
              className={`w-full px-3 py-2.5 rounded-xl border text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary bg-xa-bg ${
                errors.telephone ? 'border-red-500' : 'border-xa-border'
              }`}
            />
            {errors.telephone && (
              <p className="text-xs text-red-500 mt-0.5">{errors.telephone}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-xa-muted block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev: Record<string, string>) => ({ ...prev, email: '' }));
              }}
              placeholder="client@email.com"
              className={`w-full px-3 py-2.5 rounded-xl border text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary bg-xa-bg ${
                errors.email ? 'border-red-500' : 'border-xa-border'
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
          </div>

          {/* Opt-in WhatsApp toggle */}
          <div className="flex items-center justify-between bg-xa-bg rounded-xl px-4 py-3 border border-xa-border">
            <div>
              <p className="text-sm font-semibold text-xa-text">📱 Opt-in WhatsApp</p>
              <p className="text-xs text-xa-muted">Client accepte les messages WhatsApp</p>
            </div>
            <button
              type="button"
              onClick={() => setOptIn((v: boolean) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                optIn ? 'bg-green-500' : 'bg-xa-border'
              }`}
              aria-checked={optIn}
              role="switch"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  optIn ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-xa-muted block mb-1">Note interne</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Informations utiles sur ce client…"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2.5 rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary resize-none"
            />
            <p className="text-xs text-xa-muted text-right mt-0.5">{note.length}/500</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-xa-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-xa-border text-xa-text text-sm font-medium hover:bg-xa-bg transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
