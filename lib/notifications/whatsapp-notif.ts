// TODO: Replace with real WhatsApp Business API integration

export interface InscriptionNotifPayload {
  nom: string;
  boutique_nom: string;
  boutique_zone: string;
  email: string;
  telephone_whatsapp: string;
  comment_connu?: string | null;
}

/**
 * Notifies the MAFRO super admin of a new partner registration.
 * Currently logs to console; wire up WhatsApp Business API when ready.
 */
export function notifyNewInscription(payload: InscriptionNotifPayload): void {
  console.log('[INSCRIPTION]', {
    nom: payload.nom,
    boutique: payload.boutique_nom,
    zone: payload.boutique_zone,
    email: payload.email,
    telephone: payload.telephone_whatsapp,
    comment_connu: payload.comment_connu ?? null,
  });
}
