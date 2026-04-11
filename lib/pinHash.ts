/**
 * Hache un PIN en SHA-256 (hex).
 * Utilisé côté client avant tout envoi/stockage.
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hache un PIN côté serveur (Node.js crypto).
 * Utilisé uniquement dans les API routes.
 */
export function hashPinServer(pin: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto');
  return crypto.createHash('sha256').update(pin).digest('hex');
}
