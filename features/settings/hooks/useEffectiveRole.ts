'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { EffectiveRole } from '@/lib/auth/getEffectiveRole';

type UseEffectiveRoleResult = {
  role: EffectiveRole | null;
  loading: boolean;
  error: string | null;
};

/**
 * Client-side hook that fetches the current user's effective role.
 * Prefer using the server-side `getEffectiveRole()` in Server Components.
 * Use this hook only in Client Components where SSR is not available.
 */
export function useEffectiveRole(): UseEffectiveRoleResult {
  const [result, setResult] = useState<UseEffectiveRoleResult>({
    role: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();

    async function fetchRole() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setResult({ role: null, loading: false, error: 'Non authentifié' });
        return;
      }

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

      if (isAdmin && adminRow) {
        setResult({
          role: {
            userId: user.id,
            email: user.email ?? '',
            role: 'admin',
            displayName: adminRow.nom,
            whatsapp: adminRow.telephone_whatsapp ?? null,
            mafroAdminId: adminRow.id,
          },
          loading: false,
          error: null,
        });
        return;
      }

      if (ownerBoutiques && ownerBoutiques.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nom_complet, telephone')
          .eq('id', user.id)
          .maybeSingle();

        setResult({
          role: {
            userId: user.id,
            email: user.email ?? '',
            role: 'owner',
            displayName: profile?.nom_complet ?? user.email ?? '',
            whatsapp: profile?.telephone ?? null,
            proprietaireId: user.id,
          },
          loading: false,
          error: null,
        });
        return;
      }

      if (employeRow) {
        const mafroRole = employeRow.mafro_role ?? 'staff';
        const role = mafroRole === 'manager' ? 'manager' : 'staff';
        setResult({
          role: {
            userId: user.id,
            email: user.email ?? '',
            role,
            displayName: `${employeRow.prenom ?? ''} ${employeRow.nom ?? ''}`.trim() || (user.email ?? ''),
            whatsapp: null,
            employeId: employeRow.id,
            boutiqueIdAssignee: employeRow.boutique_id,
          },
          loading: false,
          error: null,
        });
        return;
      }

      // Fallback: owner without boutiques
      const { data: profile } = await supabase
        .from('profiles')
        .select('nom_complet, telephone')
        .eq('id', user.id)
        .maybeSingle();

      setResult({
        role: {
          userId: user.id,
          email: user.email ?? '',
          role: 'owner',
          displayName: profile?.nom_complet ?? user.email ?? '',
          whatsapp: profile?.telephone ?? null,
          proprietaireId: user.id,
        },
        loading: false,
        error: null,
      });
    }

    fetchRole().catch((err: unknown) => {
      setResult({
        role: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    });
  }, []);

  return result;
}
