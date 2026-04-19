import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/produits/categories?boutique_id=xxx
 * Returns distinct categories for active products in the given boutique.
 */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { error: authError } = await getAuthUser();
  if (authError) return authError;

  const boutiqueId = request.nextUrl.searchParams.get('boutique_id');
  if (!boutiqueId) {
    return NextResponse.json({ error: 'boutique_id requis' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('produits')
    .select('categorie')
    .eq('boutique_id', boutiqueId)
    .eq('actif', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const categories = [...new Set((data ?? []).map((p) => p.categorie as string))].sort();

  return NextResponse.json(categories);
}
