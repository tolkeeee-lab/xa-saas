/**
 * GET /api/employe/boutique-info?boutique_id=UUID
 *
 * Public endpoint — returns minimal boutique info (id, nom) so the employee
 * lock screen can display the boutique name without requiring auth.
 *
 * Response 200: { id: string, nom: string }
 * Response 404: { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const boutique_id = searchParams.get('boutique_id');

  if (!boutique_id) {
    return NextResponse.json({ error: 'boutique_id requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('boutiques')
    .select('id, nom')
    .eq('id', boutique_id)
    .eq('actif', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });
  }

  return NextResponse.json({ id: data.id, nom: data.nom });
}
