import { createClient } from '@/lib/supabase-server';

export type EffectiveRole = {
  userId: string;
  email: string;
  role: 'admin' | 'owner' | 'manager' | 'staff';
  displayName: string;
  whatsapp: string | null;
  mafroAdminId?: string;
  proprietaireId?: string;
  employeId?: string;
  boutiqueIdAssignee?: string;
};

export async function getEffectiveRole(): Promise<EffectiveRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const [
    { data: isAdmin },
    { data: adminRow },
    { data: ownerBoutiques },
    { data: employeRow },
  ] = await Promise.all([
    supabase.rpc('is_mafro_admin'),
    supabase
      .from('mafro_admins')
      .select('id, nom, telephone_whatsapp')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('boutiques')
      .select('id')
      .eq('proprietaire_id', user.id)
      .limit(1),
    supabase
      .from('employes')
      .select('id, boutique_id, mafro_role, nom, prenom')
      .eq('proprietaire_id', user.id)
      .eq('actif', true)
      .maybeSingle(),
  ]);

  // Priority: admin > owner > manager/staff
  if (isAdmin && adminRow) {
    return {
      userId: user.id,
      email: user.email ?? '',
      role: 'admin',
      displayName: adminRow.nom,
      whatsapp: adminRow.telephone_whatsapp ?? null,
      mafroAdminId: adminRow.id,
    };
  }

  if (ownerBoutiques && ownerBoutiques.length > 0) {
    // Fetch profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('nom_complet, telephone')
      .eq('id', user.id)
      .maybeSingle();

    return {
      userId: user.id,
      email: user.email ?? '',
      role: 'owner',
      displayName: profile?.nom_complet ?? user.email ?? '',
      whatsapp: profile?.telephone ?? null,
      proprietaireId: user.id,
    };
  }

  if (employeRow) {
    const mafroRole = employeRow.mafro_role ?? 'staff';
    const role = mafroRole === 'manager' ? 'manager' : 'staff';
    return {
      userId: user.id,
      email: user.email ?? '',
      role,
      displayName: `${employeRow.prenom ?? ''} ${employeRow.nom ?? ''}`.trim() || (user.email ?? ''),
      whatsapp: null,
      employeId: employeRow.id,
      boutiqueIdAssignee: employeRow.boutique_id,
    };
  }

  // Fallback: treat as owner (new user with no boutiques yet)
  const { data: profile } = await supabase
    .from('profiles')
    .select('nom_complet, telephone')
    .eq('id', user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? '',
    role: 'owner',
    displayName: profile?.nom_complet ?? user.email ?? '',
    whatsapp: profile?.telephone ?? null,
    proprietaireId: user.id,
  };
}
