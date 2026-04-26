import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/clients/[id]/historique → transactions du client paginées
 *   ?page=1&per_page=10
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Vérifier que le client appartient au proprio
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id')
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const pageRaw = searchParams.get('page');
  const perPageRaw = searchParams.get('per_page');
  const page = pageRaw ? Math.max(1, parseInt(pageRaw, 10)) : 1;
  const perPage = perPageRaw ? Math.min(50, Math.max(1, parseInt(perPageRaw, 10))) : 10;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await admin
    .from('transactions')
    .select('id, boutique_id, montant_total, mode_paiement, statut, created_at', { count: 'exact' })
    .eq('client_id', id)
    .eq('statut', 'validee')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    perPage,
  });
}
