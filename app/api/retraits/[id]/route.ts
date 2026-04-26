import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/retraits/[id] — détail d'un retrait
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: retrait, error } = await admin
    .from('retraits_clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !retrait) {
    return NextResponse.json({ error: 'Retrait introuvable' }, { status: 404 });
  }

  // Check access
  const { data: boutique } = await admin
    .from('boutiques')
    .select('id')
    .eq('id', retrait.boutique_id)
    .eq('proprietaire_id', user.id)
    .maybeSingle();

  if (!boutique) {
    const { data: employe } = await admin
      .from('employes')
      .select('id')
      .eq('boutique_id', retrait.boutique_id)
      .eq('proprietaire_id', user.id)
      .eq('actif', true)
      .maybeSingle();
    if (!employe) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  return NextResponse.json(retrait);
}
