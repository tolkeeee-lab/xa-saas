import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/clients/[id]/dettes → dettes en cours du client (par téléphone)
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

  // Récupérer le client pour avoir son téléphone
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, telephone')
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }

  if (!client.telephone) {
    return NextResponse.json({ data: [], total_du: 0 });
  }

  // Chercher les dettes liées aux boutiques du proprio
  const { data: boutiques, error: boutiquesError } = await admin
    .from('boutiques')
    .select('id')
    .eq('proprietaire_id', user.id)
    .eq('actif', true);

  if (boutiquesError) {
    return NextResponse.json({ error: boutiquesError.message }, { status: 500 });
  }

  const boutiqueIds = (boutiques ?? []).map((b: { id: string }) => b.id);

  if (boutiqueIds.length === 0) {
    return NextResponse.json({ data: [], total_du: 0 });
  }

  const { data: dettes, error } = await admin
    .from('dettes')
    .select('*')
    .in('boutique_id', boutiqueIds)
    .eq('client_telephone', client.telephone)
    .in('statut', ['en_attente', 'en_retard'])
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = dettes ?? [];
  const total_du = list.reduce(
    (sum: number, d: { montant: number; montant_rembourse: number }) =>
      sum + (d.montant - d.montant_rembourse),
    0,
  );

  return NextResponse.json({ data: list, total_du });
}
