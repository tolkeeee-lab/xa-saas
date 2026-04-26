import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { applyRateLimit } from '@/lib/rateLimit';
import type { Boutique } from '@/types/database';

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/settings/boutiques/[id]
 * Updates a boutique. RLS enforces ownership; admin can update any.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const role = await getEffectiveRole();
  if (!role) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  if (role.role !== 'owner' && role.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  // Build allowed update fields using the typed Update type
  const update: Partial<Omit<Boutique, 'id'>> = {};
  if (typeof b.nom === 'string' && b.nom.trim()) update.nom = b.nom.trim();
  if ('telephone_whatsapp' in b) update.telephone_whatsapp = typeof b.telephone_whatsapp === 'string' ? b.telephone_whatsapp || null : null;
  if ('adresse' in b) update.adresse = typeof b.adresse === 'string' ? b.adresse || null : null;
  if ('zone' in b) {
    update.zone = typeof b.zone === 'string' ? b.zone || null : null;
    if (typeof b.zone === 'string' && b.zone.trim()) update.ville = b.zone.trim();
  }
  if ('horaires' in b) {
    update.horaires = (b.horaires ?? null) as Record<string, string | null> | null;
  }
  if (typeof b.couleur === 'string') update.couleur = b.couleur;
  if (typeof b.est_actif === 'boolean') update.est_actif = b.est_actif;
  if (typeof b.catalogue_public === 'boolean') update.catalogue_public = b.catalogue_public;

  const admin = createAdminClient();
  const supabase = await createClient();

  // For owner: verify ownership first (RLS on supabase client will also block)
  if (role.role === 'owner') {
    const { data: existing } = await supabase
      .from('boutiques')
      .select('id')
      .eq('id', id)
      .eq('proprietaire_id', role.userId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Boutique introuvable ou non autorisée.' }, { status: 404 });
    }
  }

  const { data: boutique, error } = await admin
    .from('boutiques')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, boutique });
}

/**
 * DELETE /api/settings/boutiques/[id]
 * Soft-deletes (deactivates) a boutique.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const role = await getEffectiveRole();
  if (!role) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  if (role.role !== 'owner' && role.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  if (role.role === 'owner') {
    const { data: existing } = await supabase
      .from('boutiques')
      .select('id')
      .eq('id', id)
      .eq('proprietaire_id', role.userId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Boutique introuvable ou non autorisée.' }, { status: 404 });
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('boutiques')
    .update({ est_actif: false, actif: false } as Partial<Omit<Boutique, 'id'>>)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
