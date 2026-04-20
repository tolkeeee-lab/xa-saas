/**
 * POST /api/employes
 *
 * Creates a new employee for the authenticated proprietaire.
 * Generates a unique invite_code and stores the hashed PIN.
 *
 * Body: { boutique_id, nom, prenom, telephone?, role, pin_hash, boutique_nom }
 * Response 201: { employe: { id, invite_code, ... } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { generateInviteCode } from '@/lib/inviteCode';

const PIN_HASH_RE = /^[0-9a-f]{64}$/i;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const {
    boutique_id,
    nom,
    prenom,
    telephone,
    role,
    pin_hash,
    boutique_nom,
  } = body as Record<string, unknown>;

  if (typeof boutique_id !== 'string' || !boutique_id) {
    return NextResponse.json({ error: 'boutique_id requis' }, { status: 400 });
  }
  if (typeof nom !== 'string' || !nom.trim()) {
    return NextResponse.json({ error: 'nom requis' }, { status: 400 });
  }
  if (typeof prenom !== 'string' || !prenom.trim()) {
    return NextResponse.json({ error: 'prenom requis' }, { status: 400 });
  }
  if (typeof role !== 'string' || !['caissier', 'gerant'].includes(role)) {
    return NextResponse.json({ error: 'role invalide' }, { status: 400 });
  }
  if (typeof pin_hash !== 'string' || !PIN_HASH_RE.test(pin_hash)) {
    return NextResponse.json({ error: 'pin_hash invalide (SHA-256 hex attendu)' }, { status: 400 });
  }

  // Verify the boutique belongs to this proprietaire
  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('id, nom')
    .eq('id', boutique_id)
    .eq('proprietaire_id', user.id)
    .single();

  if (boutiqueError || !boutique) {
    return NextResponse.json({ error: 'Boutique introuvable ou non autorisée' }, { status: 403 });
  }

  const admin = createAdminClient();
  const nomBoutique = typeof boutique_nom === 'string' && boutique_nom ? boutique_nom : boutique.nom;

  // Generate a unique invite_code (retry on collision)
  let invite_code: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateInviteCode(nomBoutique);
    const { data: existing } = await admin
      .from('employes')
      .select('id')
      .eq('invite_code', candidate)
      .maybeSingle();
    if (!existing) {
      invite_code = candidate;
      break;
    }
  }

  if (!invite_code) {
    return NextResponse.json({ error: 'Impossible de générer un code unique' }, { status: 500 });
  }

  const { data: employe, error: insertError } = await admin
    .from('employes')
    .insert({
      boutique_id,
      proprietaire_id: user.id,
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: typeof telephone === 'string' && telephone.trim() ? telephone.trim() : null,
      role: role as 'caissier' | 'gerant',
      pin: pin_hash.toLowerCase(),
      actif: true,
      invite_code,
      invite_created_at: new Date().toISOString(),
    })
    .select('id, nom, prenom, role, actif, invite_code, boutique_id, telephone')
    .single();

  if (insertError || !employe) {
    console.error('[api/employes POST]', insertError);
    return NextResponse.json(
      { error: insertError?.message ?? 'Erreur lors de la création' },
      { status: 500 },
    );
  }

  return NextResponse.json({ employe }, { status: 201 });
}
