/**
 * WhatsApp message builder for employee invite links.
 */
import { buildWhatsAppUrl } from '@/lib/notifications/whatsapp-message';

export function buildEmployeInviteMessage({
  prenom,
  boutique_nom,
  invite_url,
  pin,
}: {
  prenom: string;
  boutique_nom: string;
  invite_url: string;
  pin: string;
}): string {
  return `Bonjour ${prenom} 👋

Bienvenue dans l'équipe *${boutique_nom}* !

Ton accès *xà Caisse* :
🔗 ${invite_url}
🔢 PIN : *${pin}*

Clique le lien sur ton téléphone, tape ton PIN et tu peux vendre immédiatement.

⚠️ Ne partage jamais ton PIN.`;
}

export function buildEmployeInviteUrl(phone: string | null, message: string): string {
  return buildWhatsAppUrl(phone ?? undefined, message);
}
