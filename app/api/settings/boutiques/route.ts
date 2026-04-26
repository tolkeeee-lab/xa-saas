import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * POST /api/settings/boutiques
 * Creates a new boutique for the authenticated owner or admin.
 * Body: { nom, telephone_whatsapp?, adresse?, zone?, couleur? }
 */
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const role = await getEffectiveRole();
  if (!role) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  if (role.role !== 'owner' && role.role !== 'admin') {
    return NextResponse.json(
      { error: 'Seuls les owners et admins peuvent créer une boutique.' },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const nom = typeof b.nom === 'string' ? b.nom.trim() : '';
  if (!nom) return NextResponse.json({ error: 'nom est obligatoire.' }, { status: 400 });

  const admin = createAdminClient();

  const { data: boutique, error } = await admin
    .from('boutiques')
    .insert({
      nom,
      proprietaire_id: role.userId,
      ville: typeof b.zone === 'string' ? b.zone.trim() : '',
      quartier: null,
      code_unique: Math.random().toString(36).slice(2, 8).toUpperCase(),
      pin_caisse: Math.random().toString(36).slice(2, 8).toUpperCase(),
      couleur_theme: typeof b.couleur === 'string' ? b.couleur : '#1DDB7B',
      actif: true,
      telephone_whatsapp: typeof b.telephone_whatsapp === 'string' ? b.telephone_whatsapp.trim() || null : null,
      adresse: typeof b.adresse === 'string' ? b.adresse.trim() || null : null,
      zone: typeof b.zone === 'string' ? b.zone.trim() || null : null,
      couleur: typeof b.couleur === 'string' ? b.couleur : undefined,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, boutique }, { status: 201 });
}
