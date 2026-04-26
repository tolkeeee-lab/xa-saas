import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { clientsPostSchema, type ClientsPostInput } from '@/lib/schemas/clients';
import { revalidateUserCache } from '@/lib/revalidate';
import { getInactiveThresholdDate } from '@/features/clients/utils/clientUtils';

type SortField = 'nom' | 'derniere_visite_at' | 'total_achats';
const VALID_SORTS: readonly SortField[] = ['nom', 'derniere_visite_at', 'total_achats'] as const;

type TabFilter = 'tous' | 'avec_credit' | 'opt_in_whatsapp' | 'inactifs';
const VALID_TABS: readonly TabFilter[] = ['tous', 'avec_credit', 'opt_in_whatsapp', 'inactifs'] as const;

/**
 * GET /api/clients → liste paginée avec filtres
 *   ?tab=tous|avec_credit|opt_in_whatsapp|inactifs
 *   ?q=search (nom ou téléphone)
 *   ?sort=nom|derniere_visite_at|total_achats
 *   ?page=1
 * POST /api/clients → créer un client
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

  const { searchParams } = new URL(request.url);
  const pageRaw = searchParams.get('page');
  const page = pageRaw ? Math.max(1, parseInt(pageRaw, 10)) : 1;
  const pageSize = 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const q = searchParams.get('q')?.trim() ?? '';

  const sortRaw = searchParams.get('sort');
  const sort: SortField =
    sortRaw && (VALID_SORTS as readonly string[]).includes(sortRaw)
      ? (sortRaw as SortField)
      : 'nom';

  const tabRaw = searchParams.get('tab');
  const tab: TabFilter =
    tabRaw && (VALID_TABS as readonly string[]).includes(tabRaw)
      ? (tabRaw as TabFilter)
      : 'tous';

  const admin = createAdminClient();
  let query = admin
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('proprietaire_id', user.id)
    .eq('actif', true);

  // Tab filters
  if (tab === 'avec_credit') {
    query = query.gt('credit_actuel', 0);
  } else if (tab === 'opt_in_whatsapp') {
    query = query.eq('opt_in_whatsapp', true);
  } else if (tab === 'inactifs') {
    const inactiveThreshold = getInactiveThresholdDate();
    query = query.or(`derniere_visite_at.is.null,derniere_visite_at.lt.${inactiveThreshold}`);
  }

  // Search
  if (q) {
    query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,telephone.ilike.%${q}%`);
  }

  // Sort
  if (sort === 'derniere_visite_at') {
    query = query.order('derniere_visite_at', { ascending: false, nullsFirst: false });
  } else if (sort === 'total_achats') {
    query = query.order('total_achats', { ascending: false });
  } else {
    query = query.order('nom', { ascending: true });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const validation = validateBody(clientsPostSchema, rawBody);
  if (validation.error) return validation.error;
  const body = validation.data as ClientsPostInput;

  const admin = createAdminClient();
  // Note: the generated Insert type marks `derniere_visite_at` as required
  // (type generation lags the schema). We send `null` explicitly and cast
  // the payload through `unknown` to bypass the over-strict generated type.
  const insertPayload = {
    proprietaire_id: user.id,
    nom: body.nom.trim(),
    prenom: body.prenom?.trim() ?? null,
    telephone: body.telephone?.trim() ?? null,
    email: body.email?.trim() ?? null,
    opt_in_whatsapp: body.opt_in_whatsapp ?? false,
    note: body.note?.trim() ?? null,
    derniere_visite_at: null,
  };

  const { data, error } = await admin
    .from('clients')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(insertPayload as any)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Un client avec ce numéro de téléphone existe déjà' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['clients']);

  return NextResponse.json(data, { status: 201 });
}
 
