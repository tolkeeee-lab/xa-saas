/**
 * WhatsApp message builder for xà Caisse v3 invoice sharing.
 */
import { formatFCFA } from '@/lib/format';

export type InvoiceLine = {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  sous_total: number;
};

export type WhatsAppInvoiceData = {
  boutique_nom: string;
  boutique_ville?: string | null;
  caissier_nom?: string;
  numero_facture?: string;
  created_at: string;
  lignes: InvoiceLine[];
  sous_total: number;
  remise_pct: number;
  remise_montant: number;
  montant_total: number;
  mode_paiement: string;
  montant_recu?: number;
  monnaie_rendue?: number;
  client_nom?: string;
  client_telephone?: string;
};

const PAY_MODE_LABELS: Record<string, string> = {
  especes: '💵 Espèces',
  momo: '📱 Mobile Money',
  carte: '💳 Carte',
  credit: '🏦 Crédit',
};

/** Country calling code — defaults to Bénin (+229) */
const DEFAULT_COUNTRY_CODE = '229';

/**
 * Formats the invoice as a WhatsApp-friendly text message.
 */
export function buildWhatsAppMessage(data: WhatsAppInvoiceData): string {
  const date = new Date(data.created_at);
  const dateStr = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const lines = data.lignes
    .map((l) => `• ${l.nom} × ${l.quantite} = ${formatFCFA(l.sous_total)}`)
    .join('\n');

  let msg = `🛒 *xà — ${data.boutique_nom}*\n`;
  if (data.numero_facture) msg += `📋 ${data.numero_facture}\n`;
  msg += `📅 ${dateStr} à ${timeStr}\n`;
  if (data.client_nom) msg += `👤 Client : ${data.client_nom}\n`;
  msg += `\n${lines}\n\n`;
  msg += `Sous-total : ${formatFCFA(data.sous_total)}\n`;
  if (data.remise_montant > 0) {
    msg += `🎟️ Remise (${data.remise_pct}%) : -${formatFCFA(data.remise_montant)}\n`;
  }
  msg += `*💰 TOTAL : ${formatFCFA(data.montant_total)}*\n`;
  msg += `Paiement : ${PAY_MODE_LABELS[data.mode_paiement] ?? data.mode_paiement}\n`;
  if (data.mode_paiement === 'especes' && (data.montant_recu ?? 0) > 0) {
    msg += `Reçu : ${formatFCFA(data.montant_recu!)}\n`;
    msg += `Rendu : ${formatFCFA(data.monnaie_rendue ?? 0)}\n`;
  }
  msg += `\n✨ Merci pour votre achat !`;

  return msg;
}

/**
 * Builds a wa.me URL for the given phone number and message.
 * @param phone  Client phone number (without country code).
 * @param message  Pre-formatted message text.
 * @param countryCode  Country calling code (default: "229" for Bénin).
 */
export function buildWhatsAppUrl(
  phone: string | undefined | null,
  message: string,
  countryCode = DEFAULT_COUNTRY_CODE,
): string {
  const encoded = encodeURIComponent(message);
  if (phone) {
    // Remove leading 0 if present, then prepend country code
    const clean = phone.replace(/^\+/, '').replace(/^0/, '');
    const fullNumber = clean.startsWith(countryCode) ? clean : `${countryCode}${clean}`;
    return `https://wa.me/${fullNumber}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}
