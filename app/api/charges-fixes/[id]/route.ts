import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { chargesFixesPatchSchema } from '@/lib/schemas/charges-fixes';
import type { ChargeFixe } from '@/types/database';
import { revalidateUserCache } from '@/lib/revalidate';

type PatchBody = {
  libelle?: string;
  categorie?: ChargeFixe['categorie'];
  boutique_id?: string | null;
  montant?: number;
  periodicite?: ChargeFixe['periodicite'];
  actif?: boolean;
};

/**
 * PATCH /api/charges-fixes/[id]
 * Updates a charge fixe.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request);
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

  const { data: body, error: validationError } = validateBody(chargesFixesPatchSchema, rawBody);
  if (validationError) return validationError;

  const update: PatchBody = {};
  if (body.libelle !== undefined) update.libelle = body.libelle;
  if (body.categorie !== undefined) update.categorie = body.categorie;
  if (body.boutique_id !== undefined) update.boutique_id = body.boutique_id;
  if (body.montant !== undefined) update.montant = body.montant;
  if (body.periodicite !== undefined) update.periodicite = body.periodicite;
  if (body.actif !== undefined) update.actif = body.actif;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ensure charge belongs to this user
  const { data: existing } = await admin
    .from('charges_fixes')
    .select('id, proprietaire_id')
    .eq('id', id)
    .single();

  if (!existing || existing.proprietaire_id !== user.id) {
    return NextResponse.json({ error: 'Charge introuvable' }, { status: 404 });
  }

  const { data, error } = await admin
    .from('charges_fixes')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['charges-fixes']);

  return NextResponse.json(data);
}

/**
 * DELETE /api/charges-fixes/[id]
 * Deletes a charge fixe.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request);
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

  // Ensure charge belongs to this user
  const { data: existing } = await admin
    .from('charges_fixes')
    .select('id, proprietaire_id')
    .eq('id', id)
    .single();

  if (!existing || existing.proprietaire_id !== user.id) {
    return NextResponse.json({ error: 'Charge introuvable' }, { status: 404 });
  }

  const { error } = await admin.from('charges_fixes').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['charges-fixes']);

  return NextResponse.json({ success: true });
}
