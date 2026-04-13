'use client';

import { formatFCFA, formatDateTime } from '@/lib/format';
import type { PayMode } from './Panier';

export type TicketData = {
  transaction_id: string;
  created_at: string;
  lignes: {
    produit_id: string;
    nom: string;
    quantite: number;
    prix_unitaire: number;
    sous_total: number;
  }[];
  montant_total: number;
  remise: number;
  mode_paiement: PayMode;
  boutique_nom: string;
  offline?: boolean;
  montant_recu?: number;
  monnaie_rendue?: number;
  client_nom?: string;
};

const PAY_MODE_LABELS: Record<PayMode, string> = {
  especes: 'Espèces',
  momo: 'Mobile Money',
  carte: 'Carte bancaire',
  credit: 'Crédit',
};

interface TicketCaisseProps {
  ticket: TicketData;
  onNouvelleVente: () => void;
}

export default function TicketCaisse({ ticket, onNouvelleVente }: TicketCaisseProps) {
  const sousTotal = ticket.lignes.reduce((s, l) => s + l.sous_total, 0);

  function buildWhatsAppText(): string {
    const lines = ticket.lignes
      .map((l) => `• ${l.nom} ×${l.quantite} = ${formatFCFA(l.sous_total)}`)
      .join('\n');
    let msg = `*Ticket — ${ticket.boutique_nom}*\n${formatDateTime(ticket.created_at)}\n\n${lines}\n\n`;
    if (ticket.remise > 0) msg += `Remise : -${formatFCFA(ticket.remise)}\n`;
    msg += `*Total : ${formatFCFA(ticket.montant_total)}*\n`;
    msg += `Paiement : ${PAY_MODE_LABELS[ticket.mode_paiement]}\n`;
    if (ticket.mode_paiement === 'especes' && (ticket.montant_recu ?? 0) > 0) {
      msg += `Montant reçu : ${formatFCFA(ticket.montant_recu!)}\n`;
      msg += `Monnaie rendue : ${formatFCFA(ticket.monnaie_rendue ?? 0)}\n`;
    }
    return msg;
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(buildWhatsAppText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="ticket-print w-full max-w-sm bg-xa-surface border border-xa-border rounded-xl overflow-hidden shadow-lg">
        {/* Offline provisional banner */}
        {ticket.offline && (
          <div
            style={{
              background: '#ffb020',
              color: '#1a1a1a',
              padding: '0.5rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center',
            }}
          >
            <span>⚠️</span>
            <span>Ticket provisoire — sera synchronisé lors de la reconnexion</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-xa-primary text-white px-5 py-4 text-center">
          <div className="text-2xl mb-1">{ticket.offline ? '📵' : '✓'}</div>
          <p className="font-bold text-lg">{ticket.offline ? 'Vente hors-ligne' : 'Vente validée'}</p>
          <p className="text-sm opacity-90">{ticket.boutique_nom}</p>
          <p className="text-xs opacity-75 mt-1">{formatDateTime(ticket.created_at)}</p>
        </div>

        {/* Lines */}
        <div className="px-4 py-3 space-y-1.5">
          {ticket.lignes.map((ligne) => (
            <div key={ligne.produit_id} className="flex justify-between text-sm">
              <span className="text-xa-text">
                {ligne.nom} × {ligne.quantite}
              </span>
              <span className="font-medium text-xa-text">{formatFCFA(ligne.sous_total)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-xa-border px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm text-xa-muted">
            <span>Sous-total</span>
            <span>{formatFCFA(sousTotal)}</span>
          </div>
          {ticket.remise > 0 && (
            <div className="flex justify-between text-sm text-green-500">
              <span>Remise fidélité (5 %)</span>
              <span>− {formatFCFA(ticket.remise)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xa-text text-base pt-1 border-t border-xa-border">
            <span>Total payé</span>
            <span>{formatFCFA(ticket.montant_total)}</span>
          </div>
          <p className="text-xs text-xa-muted text-right">
            {PAY_MODE_LABELS[ticket.mode_paiement]}
          </p>
          {ticket.mode_paiement === 'especes' && (ticket.montant_recu ?? 0) > 0 && (
            <>
              <div className="flex justify-between text-sm text-xa-muted">
                <span>Montant reçu</span>
                <span>{formatFCFA(ticket.montant_recu!)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-500 font-semibold">
                <span>Monnaie rendue</span>
                <span>{formatFCFA(ticket.monnaie_rendue ?? 0)}</span>
              </div>
            </>
          )}
          {ticket.mode_paiement === 'credit' && ticket.client_nom && (
            <p className="text-xs text-xa-muted text-right mt-1">
              Client : <span className="font-medium text-xa-text">{ticket.client_nom}</span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="ticket-print-actions px-4 py-3 border-t border-xa-border flex gap-2">
          <button
            onClick={onNouvelleVente}
            className="flex-1 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Nouvelle vente
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 rounded-lg border border-xa-border text-xa-text text-sm font-medium hover:bg-xa-bg transition-colors"
          >
            Imprimer
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 py-2 rounded-lg border border-green-500/50 text-green-500 text-sm font-medium hover:bg-green-500/10 transition-colors"
          >
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
