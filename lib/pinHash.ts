/**
 * lib/pinHash.ts
 *
 * Utilitaire de hachage des PINs (SHA-256) pour xà.
 * Utilise l'API Web Crypto (disponible dans les navigateurs modernes et Node.js 18+).
 */

/**
 * Hache un PIN en hexadécimal SHA-256.
 * À utiliser côté client avant tout insert/update de PIN.
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
