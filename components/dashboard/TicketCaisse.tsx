import { formatFCFA, formatDateTime } from '@/lib/format';
import type { PayMode } from './Panier';
import PrintButton from '@/components/ui/PrintButton';

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

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="w-full max-w-sm bg-xa-surface border border-xa-border rounded-xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-xa-primary text-white px-5 py-4 text-center">
          <div className="text-2xl mb-1">✓</div>
          <p className="font-bold text-lg">Vente validée</p>
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
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-xa-border flex gap-2">
          <button
            onClick={onNouvelleVente}
            className="flex-1 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Nouvelle vente
          </button>
          <PrintButton label="Imprimer le ticket" />
        </div>
      </div>
    </div>
  );
}
