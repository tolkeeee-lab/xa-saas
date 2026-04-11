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
 * Hache un PIN côté serveur (Node.js).
 * Utilisé uniquement dans les API routes — ne jamais importer côté client.
 */
export async function hashPinServer(pin: string): Promise<string> {
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(pin).digest('hex');
}
