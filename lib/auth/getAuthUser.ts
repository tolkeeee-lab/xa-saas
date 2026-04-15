// lib/auth/getAuthUser.ts
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function getAuthUser(): Promise<
  | { user: User; error: null }
  | { user: null; error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    };
  }

  return { user, error: null };
}
