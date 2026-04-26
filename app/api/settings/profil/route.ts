import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { applyRateLimit } from '@/lib/rateLimit';
import type { MafroAdmin, Profile, Employe } from '@/types/database';

/**
 * PATCH /api/settings/profil
 * Updates the caller's profile in the appropriate table based on their role.
 * Body: { nom?: string, whatsapp?: string }
 */
export async function PATCH(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const role = await getEffectiveRole();
  if (!role) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { nom, whatsapp } = (body ?? {}) as { nom?: unknown; whatsapp?: unknown };
  const nomStr = typeof nom === 'string' ? nom.trim() : undefined;
  const whatsappStr = typeof whatsapp === 'string' ? whatsapp.trim() : undefined;

  if (!nomStr && whatsappStr === undefined) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const supabase = await createClient();

  if (role.role === 'admin') {
    const adminUpdate: Partial<Omit<MafroAdmin, 'id'>> = {};
    if (nomStr) adminUpdate.nom = nomStr;
    if (whatsappStr !== undefined) adminUpdate.telephone_whatsapp = whatsappStr || null;

    const { error } = await admin
      .from('mafro_admins')
      .update(adminUpdate)
      .eq('user_id', role.userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (role.role === 'owner') {
    const profileUpdate: Partial<Omit<Profile, 'id'>> = {};
    if (nomStr) profileUpdate.nom_complet = nomStr;
    if (whatsappStr !== undefined) profileUpdate.telephone = whatsappStr || null;

    const { error } = await supabase.from('profiles').update(profileUpdate).eq('id', role.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // manager / staff → update employes
  if (role.employeId) {
    const employeUpdate: Partial<Omit<Employe, 'id'>> = {};
    if (nomStr) {
      const parts = nomStr.split(' ');
      employeUpdate.prenom = parts[0] ?? '';
      employeUpdate.nom = parts.slice(1).join(' ') || (parts[0] ?? '');
    }
    // employes table has no whatsapp column — silently ignore

    if (Object.keys(employeUpdate).length > 0) {
      const { error } = await admin
        .from('employes')
        .update(employeUpdate)
        .eq('id', role.employeId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Impossible de déterminer le profil à mettre à jour.' }, { status: 400 });
}
