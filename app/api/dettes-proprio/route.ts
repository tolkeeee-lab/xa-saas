import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { dettesProprioPostSchema } from '@/lib/schemas/dettes-proprio';
import type { DetteProprio } from '@/types/database';
import { revalidateUserCache } from '@/lib/revalidate';

/**
 * GET /api/dettes-proprio
 * Returns all dettes proprio for the authenticated owner.
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

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('dettes_proprio')
    .select('*')
    .eq('proprietaire_id', user.id)
    .eq('actif', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []) as DetteProprio[]);
}

/**
 * POST /api/dettes-proprio
 * Creates a new dette proprio.
 */
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request);
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

  const { data: body, error: validationError } = validateBody(dettesProprioPostSchema, rawBody);
  if (validationError) return validationError;

  const { libelle, creancier, montant, montant_rembourse, date_echeance, notes } = body;

  const rembourse = montant_rembourse ?? 0;
  const statut: DetteProprio['statut'] = rembourse >= montant ? 'rembourse' : 'en_cours';

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('dettes_proprio')
    .insert({
      proprietaire_id: user.id,
      libelle,
      creancier,
      montant,
      montant_rembourse: rembourse,
      date_echeance: date_echeance ?? null,
      notes: notes ?? null,
      statut,
      actif: true,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['dettes-proprio', 'charges-fixes']);

  return NextResponse.json(data as DetteProprio, { status: 201 });
}
