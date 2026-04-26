import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/retraits?boutique_id=xxx&statut=en_attente|retire|expire&page=1
 * Returns paginated retraits for a boutique.
 */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const boutique_id = searchParams.get('boutique_id');
  const statut = searchParams.get('statut');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const PAGE_SIZE = 30;

  if (!boutique_id || !/^[0-9a-f-]{36}$/.test(boutique_id)) {
    return NextResponse.json({ error: 'boutique_id invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check access: owner or assigned employee
  const [{ data: ownedBoutique }, { data: assignedEmploye }] = await Promise.all([
    admin
      .from('boutiques')
      .select('id')
      .eq('id', boutique_id)
      .eq('proprietaire_id', user.id)
      .maybeSingle(),
    admin
      .from('employes')
      .select('id')
      .eq('boutique_id', boutique_id)
      .eq('proprietaire_id', user.id)
      .eq('actif', true)
      .maybeSingle(),
  ]);

  if (!ownedBoutique && !assignedEmploye) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const now = new Date().toISOString();

  let query = admin
    .from('retraits_clients')
    .select('*')
    .eq('boutique_id', boutique_id)
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (statut === 'en_attente') {
    query = query.eq('statut', 'en_attente').gt('expires_at', now);
  } else if (statut === 'retire') {
    // Retirés aujourd'hui
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    query = query.eq('statut', 'retire').gte('retired_at', todayStart.toISOString());
  } else if (statut === 'expire') {
    query = query.or(`statut.eq.expire,and(statut.eq.en_attente,expires_at.lt.${now})`);
  } else if (statut === 'annule') {
    query = query.eq('statut', 'annule');
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [], page });
}
