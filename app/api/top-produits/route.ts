import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getTopProduits } from '@/lib/supabase/getTopProduits';
import { applyRateLimit } from '@/lib/rateLimit';

export const revalidate = 300;

/**
 * GET /api/top-produits?dateDebut=YYYY-MM-DD&dateFin=YYYY-MM-DD&boutiqueId=all|UUID
 * Returns top sold products globally and per boutique.
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
  const dateDebut = searchParams.get('dateDebut');
  const dateFin = searchParams.get('dateFin');
  const boutiqueId = searchParams.get('boutiqueId') ?? 'all';

  if (!dateDebut || !dateFin) {
    return NextResponse.json(
      { error: 'Paramètres dateDebut et dateFin requis (format YYYY-MM-DD)' },
      { status: 400 },
    );
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateDebut) || !dateRegex.test(dateFin)) {
    return NextResponse.json(
      { error: 'Format de date invalide, utilisez YYYY-MM-DD' },
      { status: 400 },
    );
  }

  const result = await getTopProduits(user.id, dateDebut, dateFin, boutiqueId);
  return NextResponse.json(result);
}
