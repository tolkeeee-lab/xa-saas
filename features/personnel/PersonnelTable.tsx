'use client';

import { useState } from 'react';
import { formatFCFA } from '@/lib/format';
import {
  buildEmployeInviteMessage,
  buildEmployeInviteUrl,
} from '@/lib/whatsapp/employeInvite';
import type { EmployePersonnel } from '@/lib/supabase/getPersonnel';
import type { Boutique } from '@/types/database';

type PersonnelTableProps = {
  employes: EmployePersonnel[];
  boutiques: Boutique[];
  onReload?: () => Promise<void>;
};

type ToastState = { message: string; type: 'success' | 'error' } | null;

type ResetPinInfo = {
  employe_id: string;
  prenom: string;
  nom: string;
  telephone: string | null;
  boutique_nom: string;
  invite_code: string | null;
  new_pin: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default function PersonnelTable({
  employes: initialEmployes,
  boutiques,
  onReload,
}: PersonnelTableProps) {
  const [employes, setEmployes] = useState<EmployePersonnel[]>(initialEmployes);
  const [toast, setToast] = useState<ToastState>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [resetPinInfo, setResetPinInfo] = useState<ResetPinInfo | null>(null);

  const total = employes.length;
  const presents = employes.filter((e) => e.actif).length;
  const absents = total - presents;

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleToggleActif(emp: EmployePersonnel) {
    setLoadingId(emp.id);
    const res = await fetch(`/api/employes/${emp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif: !emp.actif }),
    });
    setLoadingId(null);
    if (res.ok) {
      setEmployes((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, actif: !emp.actif } : e)),
      );
      showToast(
        emp.actif ? `${emp.prenom} désactivé(e)` : `${emp.prenom} réactivé(e)`,
        'success',
      );
      if (onReload) await onReload();
    } else {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  }

  async function handleRegenerateCode(emp: EmployePersonnel) {
    setLoadingId(emp.id + '-code');
    const res = await fetch(`/api/employes/${emp.id}/regenerate-code`, { method: 'POST' });
    setLoadingId(null);
    if (res.ok) {
      const data = (await res.json()) as { invite_code: string };
      setEmployes((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, invite_code: data.invite_code } : e)),
      );
      showToast(`Nouveau code : ${data.invite_code}`, 'success');
    } else {
      showToast('Erreur lors de la regénération', 'error');
    }
  }

  async function handleResetPin(emp: EmployePersonnel) {
    setLoadingId(emp.id + '-pin');
    const res = await fetch(`/api/employes/${emp.id}/reset-pin`, { method: 'POST' });
    setLoadingId(null);
    if (res.ok) {
      const data = (await res.json()) as { pin: string };
      const boutique = boutiques.find((b) => b.id === emp.boutique_id);
      setResetPinInfo({
        employe_id: emp.id,
        prenom: emp.prenom,
        nom: emp.nom,
        telephone: emp.telephone ?? null,
        boutique_nom: boutique?.nom ?? emp.boutique_nom,
        invite_code: emp.invite_code ?? null,
        new_pin: data.pin,
      });
    } else {
      showToast('Erreur lors du reset PIN', 'error');
    }
  }

  function handleRenvoieLien(emp: EmployePersonnel) {
    if (!emp.invite_code) {
      showToast("Cet employé n'a pas encore de lien d'accès", 'error');
      return;
    }
    const invite_url = `https://xa.app/e/${emp.invite_code}`;
    const message = `Bonjour ${emp.prenom} 👋\n\nTon lien d'accès *xà Caisse* :\n🔗 ${invite_url}\n\n⚠️ Contacte le propriétaire si tu as oublié ton PIN.`;
    const url = buildEmployeInviteUrl(emp.telephone ?? null, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function sendResetPinWhatsApp(info: ResetPinInfo) {
    if (!info.invite_code) return;
    const invite_url = `https://xa.app/e/${info.invite_code}`;
    const message = buildEmployeInviteMessage({
      prenom: info.prenom,
      boutique_nom: info.boutique_nom,
      invite_url,
      pin: info.new_pin,
    });
    const url = buildEmployeInviteUrl(info.telephone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          onClick={() => setToast(null)}
          className={`fixed bottom-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white cursor-pointer ${
            toast.type === 'success' ? 'bg-aquamarine-600' : 'bg-xa-danger'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-xa-text">Personnel avancé</h1>
          <p className="text-sm text-xa-muted mt-0.5">Équipes de votre réseau</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Total employés
          </p>
          <p className="text-2xl font-bold text-xa-text">{total}</p>
        </div>
        <div className="bg-aquamarine-100 dark:bg-aquamarine-900/20 border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Actifs
          </p>
          <p className="text-2xl font-bold text-aquamarine-700">{presents}</p>
        </div>
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Inactifs
          </p>
          <p className="text-2xl font-bold text-xa-muted">{absents}</p>
        </div>
      </div>

      {/* Table */}
      {employes.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-xa-muted">Aucun employé dans votre réseau.</p>
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  {['Employé', 'Boutique', 'Poste', 'Statut', 'CA (mois)', 'Dernier login', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {employes.map((emp) => {
                  const initials =
                    `${emp.prenom.charAt(0)}${emp.nom.charAt(0)}`.toUpperCase();
                  const isLoadingCode = loadingId === emp.id + '-code';
                  const isLoadingPin = loadingId === emp.id + '-pin';
                  const isLoadingActif = loadingId === emp.id;
                  return (
                    <tr
                      key={emp.id}
                      className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                            style={{ backgroundColor: emp.boutique_couleur }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-xa-text">
                              {emp.prenom} {emp.nom}
                            </p>
                            {emp.telephone && (
                              <p className="text-xs text-xa-muted">{emp.telephone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xa-text">{emp.boutique_nom}</td>
                      <td className="px-4 py-3 capitalize text-xa-text">{emp.role}</td>
                      <td className="px-4 py-3">
                        {emp.actif ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-aquamarine-100 text-aquamarine-700 dark:bg-aquamarine-900/20">
                            Actif
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-xa-border text-xa-muted">
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-xa-text">
                        {formatFCFA(emp.ca_mois)}
                      </td>
                      <td className="px-4 py-3 text-xa-muted text-xs whitespace-nowrap">
                        {emp.last_login_at ? (
                          <span className="text-aquamarine-600">
                            🟢 {timeAgo(emp.last_login_at)}
                          </span>
                        ) : (
                          <span>⚪ Jamais connecté</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleRenvoieLien(emp)}
                            disabled={!emp.invite_code}
                            title="Renvoyer le lien par WhatsApp"
                            className="px-2 py-1 rounded border border-xa-border text-xa-muted text-xs hover:bg-xa-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            🔗 Lien
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleRegenerateCode(emp)}
                            disabled={isLoadingCode}
                            title="Régénérer le code d'invitation (invalide l'ancien)"
                            className="px-2 py-1 rounded border border-xa-border text-xa-muted text-xs hover:bg-xa-bg transition-colors disabled:opacity-40"
                          >
                            {isLoadingCode ? '…' : '🔄 Code'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleResetPin(emp)}
                            disabled={isLoadingPin}
                            title="Réinitialiser le PIN"
                            className="px-2 py-1 rounded border border-xa-border text-xa-muted text-xs hover:bg-xa-bg transition-colors disabled:opacity-40"
                          >
                            {isLoadingPin ? '…' : '🔢 PIN'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleActif(emp)}
                            disabled={isLoadingActif}
                            title={emp.actif ? 'Désactiver' : 'Réactiver'}
                            className={`px-2 py-1 rounded border text-xs transition-colors disabled:opacity-40 ${
                              emp.actif
                                ? 'border-xa-danger text-xa-danger hover:bg-red-50 dark:hover:bg-red-900/10'
                                : 'border-aquamarine-500 text-aquamarine-600 hover:bg-aquamarine-50 dark:hover:bg-aquamarine-900/10'
                            }`}
                          >
                            {isLoadingActif ? '…' : emp.actif ? '❌ Désact.' : '✅ Réact.'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset PIN success modal */}
      {resetPinInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-xa-surface border border-xa-border rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-xa-border">
              <h2 className="font-semibold text-xa-text">🔢 Nouveau PIN</h2>
              <button
                onClick={() => setResetPinInfo(null)}
                className="text-xa-muted hover:text-xa-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-xa-bg rounded-lg p-3">
                <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-2">
                  PIN de {resetPinInfo.prenom}
                </p>
                <code className="text-2xl font-bold text-xa-text font-mono tracking-widest">
                  {resetPinInfo.new_pin}
                </code>
                <p className="text-xs text-xa-muted mt-2">
                  ⚠️ Affiché une seule fois. Envoyez-le par WhatsApp immédiatement.
                </p>
              </div>
              {resetPinInfo.invite_code && (
                <button
                  type="button"
                  onClick={() => sendResetPinWhatsApp(resetPinInfo)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#25D366' }}
                >
                  📱 Envoyer par WhatsApp{resetPinInfo.telephone ? ` à ${resetPinInfo.telephone}` : ''}
                </button>
              )}
              <button
                type="button"
                onClick={() => setResetPinInfo(null)}
                className="w-full px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm font-medium hover:bg-xa-bg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
