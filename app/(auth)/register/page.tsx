import { redirect } from 'next/navigation';

/**
 * Legacy /register route — kept only as a redirect to the new public
 * partner sign-up page (/inscription) so old bookmarks keep working.
 *
 * The previous self-serve form created an `auth.users` row without
 * any linked `proprietaires` / `boutiques`, which is no longer the
 * desired flow under the MAFRO v4 onboarding.
 */
export default function RegisterRedirectPage() {
  redirect('/inscription');
}
