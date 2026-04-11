import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { Database } from '@/types/database';

type DetteUpdate = Database['public']['Tables']['dettes']['Update'];

/**
 * PATCH /api/dettes/[id] → mettre à jour statut / montant_rembourse
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { statut?: string; montant_rembourse?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  const update: DetteUpdate = {};
  if (body.statut === 'en_attente' || body.statut === 'paye' || body.statut === 'en_retard') {
    update.statut = body.statut;
  }
  if (typeof body.montant_rembourse === 'number') {
    update.montant_rembourse = body.montant_rembourse;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('dettes')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}