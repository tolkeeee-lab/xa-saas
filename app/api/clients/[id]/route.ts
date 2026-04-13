import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import type { Client } from '@/types/database';

/**
 * PATCH /api/clients/[id] → mettre à jour nom, téléphone, points, total_achats, nb_visites
 * DELETE /api/clients/[id] → soft delete (actif = false)
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: {
    nom?: unknown;
    telephone?: unknown;
    points_delta?: unknown;
    total_achats_delta?: unknown;
    increment_visites?: unknown;
  };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

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

  const updatePayload: Partial<Omit<Client, 'id'>> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.nom === 'string' && body.nom.trim()) {
    updatePayload.nom = body.nom.trim();
  }
  if (body.telephone !== undefined) {
    updatePayload.telephone =
      typeof body.telephone === 'string' && body.telephone.trim() ? body.telephone.trim() : null;
  }
  if (typeof body.points_delta === 'number') {
    updatePayload.points = Math.max(0, existing.points + body.points_delta);
  }
  if (typeof body.total_achats_delta === 'number') {
    updatePayload.total_achats = existing.total_achats + body.total_achats_delta;
  }
  if (body.increment_visites === true) {
    updatePayload.nb_visites = existing.nb_visites + 1;
  }

  const { data, error } = await admin
    .from('clients')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  return NextResponse.json({ success: true });
} 
