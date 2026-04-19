/**
 * Base64url utilities that work in both browser and Node environments.
 * These are safe to import from client components.
 */

export function base64urlDecode(input: string): string | null {
  try {
    const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof atob !== 'undefined') {
      return decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join(''),
      );
    }
    // Node (server side)
    return Buffer.from(base64, 'base64').toString('utf8');
  } catch {
    return null;
  }
}
