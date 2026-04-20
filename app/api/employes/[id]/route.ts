/**
 * PATCH /api/employes/[id]
 *
 * Updates an employee: deactivate, reactivate, or change boutique.
 * Proprietaire-only. If boutique_id changes, regenerates invite_code automatically.
 *
 * Body: Partial<{ actif, boutique_id, role, nom, prenom, telephone }>
 * Response 200: { employe, new_invite_code? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { generateInviteCode } from '@/lib/inviteCode';

export async function PATCH(
  request: NextRequest,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch the employee and verify ownership
  const { data: existing, error: fetchError } = await admin
    .from('employes')
    .select('id, boutique_id, proprietaire_id, invite_code')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 });
  }

  if (existing.proprietaire_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const updates = body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (typeof updates.actif === 'boolean') patch.actif = updates.actif;
  if (typeof updates.role === 'string' && ['caissier', 'gerant'].includes(updates.role)) {
    patch.role = updates.role;
  }
  if (typeof updates.nom === 'string' && updates.nom.trim()) {
    patch.nom = updates.nom.trim();
  }
  if (typeof updates.prenom === 'string' && updates.prenom.trim()) {
    patch.prenom = updates.prenom.trim();
  }
  if (updates.telephone !== undefined) {
    patch.telephone =
      typeof updates.telephone === 'string' && updates.telephone.trim()
        ? updates.telephone.trim()
        : null;
  }

  let newInviteCode: string | undefined;

  // If boutique changes, regenerate invite_code with new boutique prefix
  if (
    typeof updates.boutique_id === 'string' &&
    updates.boutique_id !== existing.boutique_id
  ) {
    // Verify new boutique belongs to proprietaire
    const { data: newBoutique } = await supabase
      .from('boutiques')
      .select('id, nom')
      .eq('id', updates.boutique_id)
      .eq('proprietaire_id', user.id)
      .single();

    if (!newBoutique) {
      return NextResponse.json({ error: 'Nouvelle boutique introuvable ou non autorisée' }, { status: 403 });
    }

    patch.boutique_id = updates.boutique_id;

    // Generate new invite_code for new boutique
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateInviteCode(newBoutique.nom);
      const { data: collision } = await admin
        .from('employes')
        .select('id')
        .eq('invite_code', candidate)
        .maybeSingle();
      if (!collision) {
        newInviteCode = candidate;
        break;
      }
    }

    if (newInviteCode) {
      patch.invite_code = newInviteCode;
      patch.invite_created_at = new Date().toISOString();
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Aucune modification fournie' }, { status: 400 });
  }

  const { data: employe, error: updateError } = await admin
    .from('employes')
    .update(patch)
    .eq('id', id)
    .select('id, nom, prenom, role, actif, invite_code, boutique_id, telephone, last_login_at')
    .single();

  if (updateError || !employe) {
    console.error('[api/employes PATCH]', updateError);
    return NextResponse.json(
      { error: updateError?.message ?? 'Erreur lors de la mise à jour' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    employe,
    ...(newInviteCode ? { new_invite_code: newInviteCode } : {}),
  });
}
