/**
 * Formate un montant en francs CFA : 15000 → "15 000 F"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount) + ' F';
}

/**
 * Formate une date ISO en date locale française
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
