import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { dettesPostSchema } from '@/lib/schemas/dettes';

/**
 * GET /api/dettes?boutique_id=xxx  → liste dettes d'une boutique
 * POST /api/dettes                  → créer une dette
 */

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request);
  if (limited) return limited;

  const { error: authError } = await getAuthUser();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const boutique_id = searchParams.get('boutique_id');

  const admin = createAdminClient();

  let query = admin.from('dettes').select('*').order('created_at', { ascending: false });

  if (boutique_id) {
    query = query.eq('boutique_id', boutique_id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request);
  if (limited) return limited;

  const { error: authError } = await getAuthUser();
  if (authError) return authError;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(dettesPostSchema, rawBody);
  if (validationError) return validationError;

  const { boutique_id, client_nom, client_telephone, montant, description, date_echeance } = body;

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('dettes')
    .insert({
      boutique_id,
      client_nom,
      client_telephone: client_telephone ?? null,
      montant,
      montant_rembourse: 0,
      description: description ?? null,
      statut: 'en_attente',
      date_echeance: date_echeance ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
