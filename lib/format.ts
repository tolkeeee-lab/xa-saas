/**
 * Formatting utilities for the xà application.
 */

/**
 * Format an amount in CFA Francs (XOF) using Beninese French locale.
 */
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-BJ', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date string as a French date (e.g. "11 avril 2026").
 */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

/**
 * Format a date string as a French date and time (e.g. "11 avril 2026 à 14:30").
 */
export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

/**
 * Calculate the change to return to the customer.
 * Returns 0 if the amount received is less than the total.
 */
export function calcMonnaie(recu: number, total: number): number {
  return Math.max(0, recu - total);
}
