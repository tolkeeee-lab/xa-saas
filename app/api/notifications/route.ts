import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getNotifications } from '@/lib/supabase/getNotifications';
import { applyRateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [] });

  const notifications = await getNotifications(user.id);
  return NextResponse.json({ notifications });
}
