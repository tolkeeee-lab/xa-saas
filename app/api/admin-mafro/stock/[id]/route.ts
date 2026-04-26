import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';

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
  const body = await req.json() as { stock_central?: number };

  if (body.stock_central === undefined || body.stock_central < 0) {
    return NextResponse.json({ error: 'stock_central doit être >= 0' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('produits_catalogue_admin')
    .select('stock_central')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
  }

  const { data: updated, error } = await admin
    .from('produits_catalogue_admin')
    .update({ stock_central: body.stock_central })
    .eq('id', id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: 'Erreur mise à jour stock' }, { status: 500 });
  }

  // Audit log
  await admin.from('audit_log').insert({
    action: 'update_stock_central',
    target_table: 'produits_catalogue_admin',
    target_id: id,
    actor_id: user.id,
    metadata: {
      stock_avant: existing.stock_central,
      stock_apres: body.stock_central,
    },
  });

  return NextResponse.json({ produit: updated });
}
