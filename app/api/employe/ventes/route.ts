/**
 * GET /api/employe/ventes?date_start=YYYY-MM-DD&date_end=YYYY-MM-DD&mes_ventes=1
 *
 * Returns transactions for the authenticated employee's boutique.
 * Requires xa_employe_session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmployeSession } from '@/lib/employe-session-server';
import { getVentesForEmploye } from '@/lib/supabase/getVentesForEmploye';

export async function GET(request: NextRequest) {
  const session = await getEmployeSession();
  if (!session) {
    return NextResponse.json({ error: 'Session employé requise' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const date_start = searchParams.get('date_start') ?? undefined;
  const date_end = searchParams.get('date_end') ?? undefined;
  const mesVentes = searchParams.get('mes_ventes') === '1';

  const data = await getVentesForEmploye(session, {
    date_start,
    date_end,
    employe_id: mesVentes ? session.employe_id : undefined,
  });

  return NextResponse.json(data);
}
