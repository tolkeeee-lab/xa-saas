'use client';

import { Phone, MessageCircle, Pencil, Trash2, X } from 'lucide-react';
import { formatFCFA } from '@/lib/format';
import type { Client } from '@/types/database';
import HistoriqueAchats from '@/features/clients/components/HistoriqueAchats';
import DettesEnCours from '@/features/clients/components/DettesEnCours';
import { getInitials, avatarColor, timeAgo } from '@/features/clients/utils/clientUtils';

type Props = {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ClientDetailModal({ client, onClose, onEdit, onDelete }: Props) {
  const initials = getInitials(client.nom, client.prenom);
  const gradient = avatarColor(client.nom);
  const fullName = client.prenom ? `${client.prenom} ${client.nom}` : client.nom;
  const ticketMoyen =
    client.nb_visites > 0 ? Math.round(client.total_achats / client.nb_visites) : 0;

  const waNumber = client.telephone?.replace(/\D/g, '');
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=Bonjour%20${encodeURIComponent(fullName)}%20!`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-xa-surface border border-xa-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-xa-border">
          {/* Avatar */}
          <div
            className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
          >
            <span className="text-lg font-bold text-white">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-xa-text">{fullName}</h2>
            {client.telephone && (
              <div className="flex items-center gap-2 mt-0.5">
                <a
                  href={`tel:${client.telephone}`}
                  className="text-sm text-xa-muted flex items-center gap-1 hover:text-xa-primary"
                >
                  <Phone size={13} />
                  {client.telephone}
                </a>
              </div>
            )}
            {client.email && (
              <p className="text-xs text-xa-muted mt-0.5">{client.email}</p>
            )}
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="text-xa-muted hover:text-xa-text p-1 rounded-lg flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-xa-border overflow-x-auto">
          {client.telephone && (
            <a
              href={`tel:${client.telephone}`}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-xa-primary/10 text-xa-primary hover:bg-xa-primary/20 transition-colors whitespace-nowrap min-h-[36px]"
            >
              <Phone size={14} />
              Appeler
            </a>
          )}
          {client.opt_in_whatsapp && waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors whitespace-nowrap min-h-[36px]"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-xa-bg border border-xa-border text-xa-text hover:bg-xa-border/50 transition-colors whitespace-nowrap min-h-[36px]"
          >
            <Pencil size={14} />
            Modifier
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors whitespace-nowrap min-h-[36px] ml-auto"
          >
            <Trash2 size={14} />
            Supprimer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-0 border-b border-xa-border">
          {[
            { label: 'Total dépensé', value: formatFCFA(client.total_achats), color: 'text-xa-primary' },
            { label: 'Achats', value: String(client.nb_visites), color: 'text-xa-text' },
            { label: 'Ticket moyen', value: formatFCFA(ticketMoyen), color: 'text-xa-text' },
            { label: 'Dernière visite', value: timeAgo(client.derniere_visite_at ?? null), color: 'text-xa-muted' },
          ].map((s, i) => (
            <div key={i} className="text-center py-3 border-r border-xa-border last:border-r-0">
              <p className={`text-sm font-bold ${s.color} leading-tight`}>{s.value}</p>
              <p className="text-xs text-xa-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        {((client.credit_actuel ?? 0) > 0 || client.opt_in_whatsapp) && (
          <div className="flex items-center gap-2 px-5 py-2 border-b border-xa-border">
            {(client.credit_actuel ?? 0) > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 font-semibold">
                💰 Crédit en cours : {formatFCFA(client.credit_actuel)}
              </span>
            )}
            {client.opt_in_whatsapp && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 font-semibold">
                📱 Opt-in WhatsApp
              </span>
            )}
          </div>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Dettes en cours */}
          <div>
            <h3 className="text-sm font-bold text-xa-text mb-3">💳 Dettes en cours</h3>
            <DettesEnCours clientId={client.id} />
          </div>

          {/* Historique achats */}
          <div>
            <h3 className="text-sm font-bold text-xa-text mb-3">🛒 Historique achats</h3>
            <HistoriqueAchats clientId={client.id} />
          </div>

          {/* Note */}
          {client.note && (
            <div>
              <h3 className="text-sm font-bold text-xa-text mb-2">📝 Note</h3>
              <p className="text-sm text-xa-muted bg-xa-bg rounded-xl px-4 py-3 border border-xa-border">
                {client.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
