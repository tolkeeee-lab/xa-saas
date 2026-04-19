/**
 * Base64url utilities that work in both browser and Node environments.
 * These are safe to import from client components.
 *
 * Requires Node.js 10+ (for Buffer.from with base64 encoding) when running
 * server-side, or a modern browser with the `atob` global.
 */

export function base64urlEncode(input: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  // Browser fallback
  return btoa(encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode(parseInt(p, 16))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function base64urlDecode(input: string): string | null {
  try {
    const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64, 'base64').toString('utf8');
    }
    // Browser fallback
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
  } catch {
    return null;
  }
}
