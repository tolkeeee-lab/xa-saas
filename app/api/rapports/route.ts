import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getRapportsPeriode } from '@/lib/supabase/getRapports';

/**
 * GET /api/rapports?dateDebut=YYYY-MM-DD&dateFin=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
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

  if (!dateDebut || !dateFin) {
    return NextResponse.json({ error: 'Paramètres dateDebut et dateFin requis' }, { status: 400 });
  }

  // Basic format validation
  const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRe.test(dateDebut) || !isoDateRe.test(dateFin)) {
    return NextResponse.json({ error: 'Format de date invalide (YYYY-MM-DD attendu)' }, { status: 400 });
  }

  if (dateDebut > dateFin) {
    return NextResponse.json({ error: 'dateDebut doit être antérieure ou égale à dateFin' }, { status: 400 });
  }

  const data = await getRapportsPeriode(user.id, dateDebut, dateFin);
  return NextResponse.json(data);
}
