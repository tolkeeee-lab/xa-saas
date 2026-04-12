import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createHash } from 'crypto';

export async function POST(request: Request) {
  const body = (await request.json()) as { boutique_id: string; pin: string };
  const { boutique_id, pin } = body;

  if (!boutique_id || !pin) {
    return NextResponse.json({ error: 'boutique_id et pin requis' }, { status: 400 });
  }

  const pinHash = createHash('sha256').update(pin).digest('hex');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('employes')
    .select('id, nom, boutique_id')
    .eq('boutique_id', boutique_id)
    .eq('actif', true)
    .eq('pin', pinHash)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Code PIN incorrect ou employé introuvable' }, { status: 401 });
  }

  return NextResponse.json({ employe_id: data.id, employe_nom: data.nom, boutique_id: data.boutique_id });
}
