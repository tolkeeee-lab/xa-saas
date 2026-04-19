import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type StaffRow = {
  id: string;
  initials: string;
  name: string;
  boutique: string;
  role: string;
  status: 'SERVICE' | 'PAUSE' | 'OFF';
};
export type StaffData = { rows: StaffRow[]; activeCount: number; totalCount: number };

export const getStaffStatus = cache(async (
  userId: string,
  storeIds: string[],
): Promise<StaffData> => {
  const supabase = await createClient();

  const { data: boutiquesData } = await supabase
    .from('boutiques')
    .select('id, nom')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiquesData?.length) return { rows: [], activeCount: 0, totalCount: 0 };

  const allIds = boutiquesData.map((b) => b.id as string);
  const boutiqueIds = storeIds.length > 0 ? allIds.filter((id) => storeIds.includes(id)) : allIds;
  const boutiqueMap = new Map(boutiquesData.map((b) => [b.id as string, b.nom as string]));

  const { data: employes } = await supabase
    .from('employes')
    .select('id, nom, prenom, role, actif, boutique_id')
    .in('boutique_id', boutiqueIds)
    .order('nom', { ascending: true });

  const rows: StaffRow[] = (employes ?? []).map((e) => {
    const fullName = `${e.prenom as string} ${e.nom as string}`.trim();
    const initials = fullName
      .split(' ')
      .filter((p) => p.length > 0)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join('');
    return {
      id: e.id as string,
      initials,
      name: fullName,
      boutique: boutiqueMap.get(e.boutique_id as string) ?? '',
      role: e.role as string,
      status: (e.actif as boolean) ? 'SERVICE' : 'OFF',
    };
  });

  const activeCount = rows.filter((r) => r.status === 'SERVICE').length;
  return { rows, activeCount, totalCount: rows.length };
});
