/**
 * PIN hashing utilities using Web Crypto API (SHA-256).
 * hashPin runs in the browser before any PIN is sent to the server.
 * verifyPin runs server-side only via /api/caisse/verify-pin.
 */

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPin(pin: string): Promise<string> {
  return sha256Hex(pin);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const pinHash = await sha256Hex(pin);
  return pinHash === hash;
}
