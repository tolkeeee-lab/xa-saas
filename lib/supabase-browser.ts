'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createClient(): SupabaseClient<Database> {
  // createBrowserClient returns a SupabaseClient<D, SchemaName, Schema> with 3 type
  // params. The 3-param signature misroutes types; casting to 1-param fixes inference.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ) as unknown as SupabaseClient<Database>;
}
