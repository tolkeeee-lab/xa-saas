// lib/auth/getAuthUser.ts
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function getAuthUser(): Promise<
  | { user: import('@supabase/supabase-js').User; error: null }
  | { user: null; error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    };
  }

  return { user, error: null };
}
