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
  const boutiqueIdParam = searchParams.get('boutique_id');

  const admin = createAdminClient();

  const { data: boutiques, error: boutiquesError } = await admin
    .from('boutiques')
    .select('id')
    .eq('proprietaire_id', user.id);

  if (boutiquesError)
    return NextResponse.json({ error: boutiquesError.message }, { status: 500 });

  const boutiqueIds = (boutiques ?? []).map((b) => b.id);
  if (boutiqueIds.length === 0) return NextResponse.json({ data: [], total: 0, page });

  const filteredIds =
    boutiqueIdParam && boutiqueIds.includes(boutiqueIdParam)
      ? [boutiqueIdParam]
      : boutiqueIds;

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    admin
      .from('commandes_b2b')
      .select('*')
      .in('boutique_id', filteredIds)
      .order('created_at', { ascending: false })
      .range((page - 1) * 20, page * 20 - 1),
    admin
      .from('commandes_b2b')
      .select('*', { count: 'exact', head: true })
      .in('boutique_id', filteredIds),
  ]);

  if (error ?? countError) {
    return NextResponse.json(
      { error: (error ?? countError)!.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page });
}
