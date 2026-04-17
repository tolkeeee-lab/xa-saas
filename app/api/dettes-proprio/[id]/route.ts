import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { dettesProprioPathSchema } from '@/lib/schemas/dettes-proprio';
import type { DetteProprio, Database } from '@/types/database';
import { revalidateUserCache } from '@/lib/revalidate';

type DetteProprioPatch = Database['public']['Tables']['dettes_proprio']['Update'];

/**
 * PATCH /api/dettes-proprio/[id]
 * Updates statut and/or montant_rembourse of a dette proprio.
 */
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

  const { data: body, error: validationError } = validateBody(dettesProprioPathSchema, rawBody);
  if (validationError) return validationError;

  const update: DetteProprioPatch = {};

  if (body.statut !== undefined) update.statut = body.statut;
  if (body.montant_rembourse !== undefined) update.montant_rembourse = body.montant_rembourse;
  if (body.notes !== undefined) update.notes = body.notes;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ensure dette belongs to this user
  const { data: existing } = await admin
    .from('dettes_proprio')
    .select('id, proprietaire_id, montant, montant_rembourse')
    .eq('id', id)
    .single();

  if (!existing || existing.proprietaire_id !== user.id) {
    return NextResponse.json({ error: 'Dette introuvable' }, { status: 404 });
  }

  // Auto-update statut to 'rembourse' if fully paid
  const newMontantRembourse =
    update.montant_rembourse !== undefined
      ? (update.montant_rembourse as number)
      : existing.montant_rembourse;

  if (update.statut === undefined && newMontantRembourse >= existing.montant) {
    update.statut = 'rembourse';
  }

  const { data, error } = await admin
    .from('dettes_proprio')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['dettes-proprio', 'charges-fixes']);

  return NextResponse.json(data as DetteProprio);
}

/**
 * DELETE /api/dettes-proprio/[id]
 * Soft-deletes a dette proprio (sets actif = false).
 */
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

  // Ensure dette belongs to this user
  const { data: existing } = await admin
    .from('dettes_proprio')
    .select('id, proprietaire_id')
    .eq('id', id)
    .single();

  if (!existing || existing.proprietaire_id !== user.id) {
    return NextResponse.json({ error: 'Dette introuvable' }, { status: 404 });
  }

  const { error } = await admin
    .from('dettes_proprio')
    .update({ actif: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['dettes-proprio', 'charges-fixes']);

  return NextResponse.json({ success: true });
}