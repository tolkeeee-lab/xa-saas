import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/clients/stats → compteurs par tab + top dépensiers
 */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const admin = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: clients, error } = await admin
    .from('clients')
    .select('id, opt_in_whatsapp, credit_actuel, derniere_visite_at, total_achats')
    .eq('proprietaire_id', user.id)
    .eq('actif', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type ClientStat = {
    id: string;
    opt_in_whatsapp: boolean;
    credit_actuel: number | null;
    derniere_visite_at: string | null;
    total_achats: number;
  };
  const all = (clients ?? []) as ClientStat[];
  const total = all.length;
  const avec_credit = all.filter((c) => (c.credit_actuel ?? 0) > 0).length;
  const opt_in = all.filter((c) => c.opt_in_whatsapp).length;
  const inactifs = all.filter(
    (c) => !c.derniere_visite_at || c.derniere_visite_at < thirtyDaysAgo,
  ).length;

  return NextResponse.json({
    tous: total,
    avec_credit,
    opt_in_whatsapp: opt_in,
    inactifs,
  });
}
