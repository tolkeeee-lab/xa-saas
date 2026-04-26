import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const categorie = searchParams.get('categorie');
  const search = searchParams.get('search');

  const admin = createAdminClient();

  let query = admin
    .from('produits_catalogue_admin')
    .select('*')
    .eq('est_actif', true);
  let countQuery = admin
    .from('produits_catalogue_admin')
    .select('*', { count: 'exact', head: true })
    .eq('est_actif', true);

  if (categorie) {
    query = query.eq('categorie', categorie);
    countQuery = countQuery.eq('categorie', categorie);
  }
  if (search) {
    query = query.ilike('nom', `%${search}%`);
    countQuery = countQuery.ilike('nom', `%${search}%`);
  }

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    query.order('nom').range((page - 1) * 50, page * 50 - 1),
    countQuery,
  ]);

  if (error || countError) {
    return NextResponse.json(
      { error: (error || countError)!.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page });
}
