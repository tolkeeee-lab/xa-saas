import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { clientsPostSchema } from '@/lib/schemas/clients';
import { revalidateUserCache } from '@/lib/revalidate';

/*
 * SQL migration (run once in Supabase SQL editor — do NOT execute from code):
 *
 * CREATE TABLE clients (
 *   id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   proprietaire_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   nom             text NOT NULL,
 *   telephone       text,
 *   points          integer NOT NULL DEFAULT 0,
 *   total_achats    numeric NOT NULL DEFAULT 0,
 *   nb_visites      integer NOT NULL DEFAULT 0,
 *   actif           boolean NOT NULL DEFAULT true,
 *   created_at      timestamptz NOT NULL DEFAULT now(),
 *   updated_at      timestamptz NOT NULL DEFAULT now()
 * );
 * CREATE INDEX idx_clients_proprietaire ON clients(proprietaire_id);
 * CREATE INDEX idx_clients_telephone ON clients(telephone);
 * ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "proprio can manage own clients" ON clients FOR ALL
 *   USING (auth.uid() = proprietaire_id)
 *   WITH CHECK (auth.uid() = proprietaire_id);
 * ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
 * CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id);
 */

/**
 * GET /api/clients → liste les clients actifs du proprio connecté
 * POST /api/clients → créer un client
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
    .from('clients')
    .select('*')
    .eq('proprietaire_id', user.id)
    .eq('actif', true)
    .order('points', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

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

  const { data: body, error: validationError } = validateBody(clientsPostSchema, rawBody);
  if (validationError) return validationError;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('clients')
    .insert({
      proprietaire_id: user.id,
      nom: body.nom.trim(),
      telephone: body.telephone?.trim() ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['clients']);

  return NextResponse.json(data, { status: 201 });
}
