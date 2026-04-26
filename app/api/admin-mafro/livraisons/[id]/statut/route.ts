import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';
import type { Livraison } from '@/types/database';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireMafroAdmin();
  } catch (err) {
    const res = err as Response;
    return NextResponse.json({ error: res.statusText }, { status: res.status });
  }

  const { id } = await params;
  const body = await req.json() as { statut?: string };

  const validStatuts: Livraison['statut'][] = ['preparation', 'en_route', 'livree', 'retournee'];
  if (!body.statut || !validStatuts.includes(body.statut as Livraison['statut'])) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('livraisons')
    .select('statut, commande_b2b_id')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Livraison non trouvée' }, { status: 404 });
  }

  const newStatut = body.statut as Livraison['statut'];
  const now = new Date().toISOString();

  const updatePayload: Partial<Omit<Livraison, 'id'>> = { statut: newStatut };
  if (newStatut === 'en_route') updatePayload.parti_at = now;
  if (newStatut === 'livree') updatePayload.livre_at = now;

  const { data: updated, error } = await admin
    .from('livraisons')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: 'Erreur mise à jour livraison' }, { status: 500 });
  }

  // If livraison is marked as livrée, update the commande_b2b too
  if (newStatut === 'livree' && existing.commande_b2b_id) {
    await admin
      .from('commandes_b2b')
      .update({ statut: 'livree', livree_at: now })
      .eq('id', existing.commande_b2b_id);
  }

  // Audit log
  await admin.from('audit_log').insert({
    action: 'update_livraison_statut',
    target_table: 'livraisons',
    target_id: id,
    actor_id: user.id,
    metadata: { statut_avant: existing.statut, statut_apres: newStatut },
  });

  return NextResponse.json({ livraison: updated });
}
