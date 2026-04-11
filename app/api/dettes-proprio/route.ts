import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { DetteProprio } from '@/types/database';

type PostBody = {
  libelle?: string;
  creancier?: string;
  montant?: number;
  montant_rembourse?: number;
  date_echeance?: string | null;
  notes?: string | null;
};

/**
 * GET /api/dettes-proprio
 * Returns all dettes proprio for the authenticated owner.
 */
export async function GET() {
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { libelle, creancier, montant, montant_rembourse, date_echeance, notes } = body;

  if (!libelle || !creancier || montant == null) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  if (typeof montant !== 'number' || montant < 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 422 });
  }

  const rembourse = montant_rembourse ?? 0;
  if (typeof rembourse !== 'number' || rembourse < 0) {
    return NextResponse.json({ error: 'Montant remboursé invalide' }, { status: 422 });
  }

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

  return NextResponse.json(data as DetteProprio, { status: 201 });
}
