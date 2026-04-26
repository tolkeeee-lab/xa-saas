import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';

// POST /api/admin-mafro/livraisons — créer une livraison et dispatcher
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireMafroAdmin();
  } catch (err) {
    const res = err as Response;
    return NextResponse.json({ error: res.statusText }, { status: res.status });
  }

  const body = (await req.json()) as {
    commande_b2b_id?: string;
    chauffeur?: string;
    vehicule?: string;
    note?: string;
  };

  if (!body.commande_b2b_id || !body.chauffeur) {
    return NextResponse.json(
      { error: 'commande_b2b_id et chauffeur sont requis' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: commande } = await admin
    .from('commandes_b2b')
    .select('id, statut, numero')
    .eq('id', body.commande_b2b_id)
    .maybeSingle();

  if (!commande) {
    return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
  }
  if (commande.statut !== 'preparee') {
    return NextResponse.json(
      { error: `La commande doit être en statut "preparee" (actuel: ${commande.statut})` },
      { status: 409 },
    );
  }

  const numero = `LIV-${commande.numero}-${Date.now().toString(36).toUpperCase()}`;

  // Note: generated Insert types mark several nullable columns as required
  // (type generation lags schema). We bypass with `as any` — runtime safe.
  const livraisonPayload = {
    commande_b2b_id: body.commande_b2b_id,
    numero,
    chauffeur: body.chauffeur,
    vehicule: body.vehicule ?? null,
    note: body.note ?? null,
    parti_at: null,
    livre_at: null,
    destination_lat: null,
    destination_lng: null,
    position_actuelle_lat: null,
    position_actuelle_lng: null,
    last_ping: null,
  };

  const { data: livraison, error } = await admin
    .from('livraisons')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(livraisonPayload as any)
    .select()
    .single();

  if (error || !livraison) {
    return NextResponse.json({ error: 'Erreur création livraison' }, { status: 500 });
  }

  const updatePayload = { statut: 'en_route' };
  await admin
    .from('commandes_b2b')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updatePayload as any)
    .eq('id', body.commande_b2b_id);

  const auditPayload = {
    action: 'dispatch_livraison',
    target_table: 'livraisons',
    target_id: livraison.id,
    actor_id: user.id,
    metadata: {
      commande_b2b_id: body.commande_b2b_id,
      chauffeur: body.chauffeur,
      vehicule: body.vehicule ?? null,
    },
  };
  await admin
    .from('audit_log')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(auditPayload as any);

  return NextResponse.json({ livraison }, { status: 201 });
}
