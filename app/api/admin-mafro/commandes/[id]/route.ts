import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';

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
