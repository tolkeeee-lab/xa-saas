/**
 * POST /api/employes/[id]/regenerate-code
 *
 * Generates a new invite_code for the employee, invalidating the old link.
 * Proprietaire-only.
 *
 * Response 200: { invite_code: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { generateInviteCode } from '@/lib/inviteCode';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch employee + boutique info, verify ownership
  const { data: employe, error: fetchError } = await admin
    .from('employes')
    .select('id, proprietaire_id, boutique_id')
    .eq('id', id)
    .single();

  if (fetchError || !employe) {
    return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 });
  }

  if (employe.proprietaire_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { data: boutique } = await admin
    .from('boutiques')
    .select('nom')
    .eq('id', employe.boutique_id)
    .single();

  const boutiqueNom = boutique?.nom ?? 'XXXX';

  let invite_code: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateInviteCode(boutiqueNom);
    const { data: collision } = await admin
      .from('employes')
      .select('id')
      .eq('invite_code', candidate)
      .maybeSingle();
    if (!collision) {
      invite_code = candidate;
      break;
    }
  }

  if (!invite_code) {
    return NextResponse.json({ error: 'Impossible de générer un code unique' }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from('employes')
    .update({ invite_code, invite_created_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) {
    console.error('[api/employes/regenerate-code]', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ invite_code });
}
