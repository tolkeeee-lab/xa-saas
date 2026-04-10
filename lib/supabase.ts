/**
 * lib/supabase.ts
 *
 * Client Supabase typé pour xà.
 *
 * Variables d'environnement requises (à définir dans .env.local) :
 *   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables d\'environnement Supabase manquantes : ' +
      'NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requises.'
  );
}

/**
 * Client Supabase partagé, typé via le schéma Database.
 * À utiliser côté client (browser) et dans les Server Components Next.js.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
