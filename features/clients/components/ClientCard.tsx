'use client';

import { Phone, MessageCircle } from 'lucide-react';
import { formatFCFA } from '@/lib/format';
import type { Client } from '@/types/database';
import { getInitials, avatarColor, timeAgo } from '@/features/clients/utils/clientUtils';

type Props = {
  client: Client;
  onClick: () => void;
};

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
