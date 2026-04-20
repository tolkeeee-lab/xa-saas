/**
 * POST /api/employe/clients
 *
 * Creates a new client for the authenticated employee's boutique proprietaire.
 * Requires xa_employe_session cookie.
 *
 * Body: { nom: string, telephone?: string }
 * Response: { client: Client }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmployeSession } from '@/lib/employe-session-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const session = await getEmployeSession();
  if (!session) {
    return NextResponse.json({ error: 'Session employé requise' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (
    !rawBody ||
    typeof rawBody !== 'object' ||
    typeof (rawBody as Record<string, unknown>).nom !== 'string' ||
    !(rawBody as Record<string, unknown>).nom
  ) {
    return NextResponse.json({ error: 'nom requis' }, { status: 400 });
  }

  const { nom, telephone } = rawBody as { nom: string; telephone?: string };

  const admin = createAdminClient();

  // Get proprietaire_id from boutique
  const { data: boutique, error: boutiqueError } = await admin
    .from('boutiques')
    .select('proprietaire_id')
    .eq('id', session.boutique_id)
    .single();

  if (boutiqueError || !boutique) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });
  }

  const { data: client, error: insertError } = await admin
    .from('clients')
    .insert({
      proprietaire_id: boutique.proprietaire_id,
      nom: nom.trim(),
      telephone: telephone?.trim() || null,
      points: 0,
      total_achats: 0,
      nb_visites: 0,
      actif: true,
    })
    .select('id, proprietaire_id, nom, telephone, points, total_achats, nb_visites, actif, created_at, updated_at')
    .single();

  if (insertError || !client) {
    return NextResponse.json({ error: 'Erreur lors de la création du client' }, { status: 500 });
  }

  return NextResponse.json({ client });
}
