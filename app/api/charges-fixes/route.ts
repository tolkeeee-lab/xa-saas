import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { chargesFixesPostSchema } from '@/lib/schemas/charges-fixes';

/**
 * GET /api/charges-fixes
 * Returns all charges fixes for the authenticated owner.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('charges_fixes')
    .select('*')
    .eq('proprietaire_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/charges-fixes
 * Creates a new charge fixe.
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request);
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

  const { data: body, error: validationError } = validateBody(chargesFixesPostSchema, rawBody);
  if (validationError) return validationError;

  const { libelle, categorie, boutique_id, montant, periodicite } = body;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('charges_fixes')
    .insert({
      proprietaire_id: user.id,
      boutique_id: boutique_id ?? null,
      libelle,
      categorie,
      montant,
      periodicite: periodicite ?? 'mensuel',
      actif: true,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
