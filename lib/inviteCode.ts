/**
 * Employee invite code generation.
 *
 * Format: XAAK-7F3Q
 *   • 4-letter boutique prefix (letters from the boutique name, uppercased, accents removed)
 *   • dash separator
 *   • 4 random base-32 chars (ambiguous chars 0, 1, I, O excluded)
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes 0, 1, I, O

/** 4 letters extracted from the boutique name (uppercase, accents removed). */
export function boutiquePrefix(boutiqueNom: string): string {
  const cleaned = boutiqueNom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  if (cleaned.length >= 4) return cleaned.slice(0, 4);
  return (cleaned + 'XXXX').slice(0, 4);
}

/** 4 random base-32 chars without ambiguous characters. */
export function randomSuffix(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/** Generate a unique invite code for the given boutique. */
export function generateInviteCode(boutiqueNom: string): string {
  return `${boutiquePrefix(boutiqueNom)}-${randomSuffix()}`;
}
