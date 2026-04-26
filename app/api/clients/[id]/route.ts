import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { clientsPatchSchema, type ClientsPatchInput } from '@/lib/schemas/clients';
import { revalidateUserCache } from '@/lib/revalidate';

/**
 * GET /api/clients/[id]   → détail client
 * PATCH /api/clients/[id] → mise à jour partielle
 * DELETE /api/clients/[id] → soft delete (actif = false)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { id } = await params;

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
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .eq('actif', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { id } = await params;

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

  const validation = validateBody(clientsPatchSchema, rawBody);
  if (validation.error) return validation.error;
  const body = validation.data as ClientsPatchInput;

  const admin = createAdminClient();

  // Vérifier que le client appartient au proprio connecté
  const { data: existing, error: fetchError } = await admin
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }

  const updatePayload: Partial<{
    updated_at: string;
    nom: string;
    prenom: string | null;
    telephone: string | null;
    email: string | null;
    opt_in_whatsapp: boolean;
    note: string | null;
  }> = { updated_at: new Date().toISOString() };

  if (body.nom !== undefined) updatePayload.nom = body.nom.trim();
  if (body.prenom !== undefined) updatePayload.prenom = body.prenom?.trim() ?? null;
  if (body.telephone !== undefined) updatePayload.telephone = body.telephone?.trim() ?? null;
  if (body.email !== undefined) updatePayload.email = body.email?.trim() ?? null;
  if (body.opt_in_whatsapp !== undefined) updatePayload.opt_in_whatsapp = body.opt_in_whatsapp;
  if (body.note !== undefined) updatePayload.note = body.note?.trim() ?? null;

  const { data, error } = await admin
    .from('clients')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Un client avec ce numéro de téléphone existe déjà' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['clients']);

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Vérifier que le client appartient au proprio connecté
  const { data: existing, error: fetchError } = await admin
    .from('clients')
    .select('id')
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }

  const { error } = await admin
    .from('clients')
    .update({ actif: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['clients']);

  return NextResponse.json({ success: true });
}

