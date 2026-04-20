/**
 * Server-only employee session utilities.
 *
 * This module reads/writes HttpOnly cookies and redirects — it MUST only be
 * imported from Server Components, Server Actions, or Route Handlers.
 * The `server-only` guard below enforces this at build time.
 */

import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  validateEmployeSessionToken,
  EMPLOYE_COOKIE_NAME,
  type EmployeSession,
} from './employe-session';

// Re-export for convenience so callers can import everything from one place.
export type { EmployeSession };

/**
 * Server Component — reads the `xa_employe_session` cookie and returns the
 * validated session, or null if absent / expired / invalid.
 */
export async function getEmployeSession(): Promise<EmployeSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EMPLOYE_COOKIE_NAME)?.value ?? null;
  return validateEmployeSessionToken(token);
}

/**
 * Server Component guard — redirects to `/caisse/lock` if no valid session.
 * Use at the top of each protected page server component.
 */
export async function requireEmployeSession(): Promise<EmployeSession> {
  const session = await getEmployeSession();
  if (!session) {
    redirect('/caisse/lock');
    // redirect() throws — this line is unreachable but satisfies TypeScript.
    throw new Error('unreachable');
  }
  return session;
}
