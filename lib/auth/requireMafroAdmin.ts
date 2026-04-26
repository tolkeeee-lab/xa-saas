import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { User } from '@supabase/supabase-js';

/**
 * Server-side guard for MAFRO admin routes.
 * Throws a Response with 401 or 403 if the user is not authenticated or not a MAFRO admin.
 * Returns the authenticated user if authorised.
 */
export async function requireMafroAdmin(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from('mafro_admins')
    .select('id, est_actif')
    .eq('user_id', user.id)
    .eq('est_actif', true)
    .maybeSingle();

  if (!data) {
    throw new Response('Forbidden', { status: 403 });
  }

  return user;
}
