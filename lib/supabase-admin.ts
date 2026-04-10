/**
 * lib/supabase-admin.ts
 *
 * Client Supabase avec la clé service-role.
 * À utiliser UNIQUEMENT dans les API routes côté serveur (jamais dans le browser).
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!serviceKey) {
    throw new Error('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY est manquant');
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
