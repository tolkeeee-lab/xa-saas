import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';
import type { Livraison } from '@/types/database';

// POST /api/admin-mafro/livraisons — créer une livraison et dispatcher
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireMafroAdmin();
  } catch (err) {
    const res = err as Response;
    return NextResponse.json({ error: res.statusText }, { status: res.status });
  }

  const body = await req.json() as {
    commande_b2b_id?: string;
    chauffeur?: string;
    vehicule?: string;
    note?: string;
  };

  if (!body.commande_b2b_id || !body.chauffeur) {
    return NextResponse.json({ error: 'commande_b2b_id et chauffeur sont requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify the commande is in 'preparee' state
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

  // Generate a unique livraison number
  const numero = `LIV-${commande.numero}-${Date.now().toString(36).toUpperCase()}`;

  const { data: livraison, error } = await admin
    .from('livraisons')
    .insert({
      commande_b2b_id: body.commande_b2b_id,
      numero,
      chauffeur: body.chauffeur,
      vehicule: body.vehicule ?? null,
      note: body.note ?? null,
    })
    .select()
    .single();

  if (error || !livraison) {
    return NextResponse.json({ error: 'Erreur création livraison' }, { status: 500 });
  }

  // Update commande statut → en_route
  await admin
    .from('commandes_b2b')
    .update({ statut: 'en_route' })
    .eq('id', body.commande_b2b_id);

  // Audit log
  await admin.from('audit_log').insert({
    action: 'dispatch_livraison',
    target_table: 'livraisons',
    target_id: livraison.id,
    actor_id: user.id,
    metadata: {
      commande_b2b_id: body.commande_b2b_id,
      chauffeur: body.chauffeur,
      vehicule: body.vehicule ?? null,
    },
  });

  return NextResponse.json({ livraison }, { status: 201 });
}
