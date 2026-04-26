'use client';

import { Phone, MessageCircle } from 'lucide-react';
import { formatFCFA } from '@/lib/format';
import type { Client } from '@/types/database';

type Props = {
  client: Client;
  onClick: () => void;
};

function getInitials(nom: string, prenom: string | null): string {
  const p = prenom?.trim()[0]?.toUpperCase() ?? '';
  const n = nom.trim()[0]?.toUpperCase() ?? '';
  return (p + n) || n || '?';
}

function avatarColor(name: string): string {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-green-600',
    'from-sky-500 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % colors.length;
  }
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Jamais';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 30) return `Il y a ${days}j`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'Il y a 1 mois';
  if (months < 12) return `Il y a ${months} mois`;
  return `Il y a ${Math.floor(months / 12)} an${Math.floor(months / 12) > 1 ? 's' : ''}`;
}

export default function ClientCard({ client, onClick }: Props) {
  const initials = getInitials(client.nom, client.prenom);
  const gradient = avatarColor(client.nom);
  const fullName = client.prenom
    ? `${client.prenom} ${client.nom}`
    : client.nom;

  function handlePhoneClick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
  }

  function handleWaClick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-xa-surface border border-xa-border rounded-xl p-4 flex items-start gap-3 hover:border-xa-primary/40 transition-colors active:scale-[.99]"
    >
      {/* Avatar */}
      <div
        className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-sm font-semibold text-white">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-xa-text truncate">{fullName}</p>
            {client.telephone && (
              <div className="flex items-center gap-2 mt-0.5">
                <a
                  href={`tel:${client.telephone}`}
                  onClick={handlePhoneClick}
                  className="text-xs text-xa-muted flex items-center gap-1 hover:text-xa-primary"
                >
                  <Phone size={11} />
                  {client.telephone}
                </a>
                {client.opt_in_whatsapp && (
                  <a
                    href={`https://wa.me/${client.telephone.replace(/\D/g, '')}?text=Bonjour%20${encodeURIComponent(fullName)}%20!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWaClick}
                    className="text-green-600 hover:text-green-700"
                    title="Envoyer un message WhatsApp"
                  >
                    <MessageCircle size={13} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {(client.credit_actuel ?? 0) > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold whitespace-nowrap">
                💰 {formatFCFA(client.credit_actuel)}
              </span>
            )}
            {client.opt_in_whatsapp && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-semibold">
                📱 WhatsApp
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-xa-muted">
            <span className="font-semibold text-xa-text">{formatFCFA(client.total_achats)}</span>{' '}
            dépensés
          </span>
          <span className="text-xs text-xa-muted">
            <span className="font-semibold text-xa-text">{client.nb_visites}</span> achat
            {client.nb_visites !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-xa-muted ml-auto">
            {timeAgo(client.derniere_visite_at ?? null)}
          </span>
        </div>
      </div>
    </button>
  );
}
