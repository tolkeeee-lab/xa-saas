import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getNotifications } from '@/lib/supabase/getNotifications';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [] });

  const notifications = await getNotifications(user.id);
  return NextResponse.json({ notifications });
}
