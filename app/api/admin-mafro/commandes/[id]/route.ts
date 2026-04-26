import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';
import type { CommandeB2B } from '@/types/database';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireMafroAdmin();
  } catch (err) {
    const res = err as Response;
    return NextResponse.json({ error: res.statusText }, { status: res.status });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: commande, error }, { data: lignes }] = await Promise.all([
    admin.from('commandes_b2b').select('*').eq('id', id).maybeSingle(),
    admin.from('commandes_b2b_lignes').select('*').eq('commande_id', id),
  ]);

  if (error || !commande) {
    return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
  }

  return NextResponse.json({ commande, lignes: lignes ?? [] });
}

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

  const validStatuts: CommandeB2B['statut'][] = [
    'soumise', 'confirmee', 'preparee', 'en_route', 'livree', 'annulee',
  ];
  if (!body.statut || !validStatuts.includes(body.statut as CommandeB2B['statut'])) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('commandes_b2b')
    .select('statut, confirmed_at')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
  }

  const newStatut = body.statut as CommandeB2B['statut'];
  const now = new Date().toISOString();

  const { data: updated, error } = await admin
    .from('commandes_b2b')
    .update({
      statut: newStatut,
      confirmed_at: newStatut === 'confirmee' && !existing.confirmed_at ? now : undefined,
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
  }

  // Audit log
  await admin.from('audit_log').insert({
    action: 'update_commande_b2b_statut',
    target_table: 'commandes_b2b',
    target_id: id,
    actor_id: user.id,
    metadata: { statut_avant: existing.statut, statut_apres: newStatut },
  });

  return NextResponse.json({ commande: updated });
}
