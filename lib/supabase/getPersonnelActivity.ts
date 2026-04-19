import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type PersonnelActivityRow = {
  id: string;
  nom: string;
  prenom: string;
  initiales: string;
  role: string;
  role_label: string;
  boutique_id: string;
  boutique_nom: string;
  actif: boolean;
  last_sale_at: string | null;
  status: 'service' | 'pause';
};

export type PersonnelActivityData = {
  rows: PersonnelActivityRow[];
  nb_actifs: number;
  nb_total: number;
};

const SERVICE_THRESHOLD_MIN = 30;

const ROLE_LABEL_MAP: Record<string, string> = {
  caissier: 'CAISSIER',
  gerant: 'GÉRANT',
  vendeur: 'VENDEUR',
};

export const getPersonnelActivity = cache(async (
  userId: string,
): Promise<PersonnelActivityData> => {
  const supabase = await createClient();

  // 1. Fetch all active boutiques for this owner (to build boutique name map)
  const { data: boutiquesData } = await supabase
    .from('boutiques')
    .select('id, nom')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  const boutiqueMap = new Map<string, string>(
    (boutiquesData ?? []).map((b) => [b.id as string, b.nom as string]),
  );

  // 2. Fetch all active employees for this owner
  const { data: employes, error } = await supabase
    .from('employes')
    .select('id, nom, prenom, role, actif, boutique_id')
    .eq('proprietaire_id', userId)
    .eq('actif', true)
    .order('nom', { ascending: true });

  if (error || !employes?.length) {
    if (error) console.error('[getPersonnelActivity]', error);
    return { rows: [], nb_actifs: 0, nb_total: 0 };
  }

  const employeeIds = employes.map((e) => e.id as string);

  // 3. Fetch last sale timestamp per employee in the last 30 min
  const thresholdIso = new Date(
    Date.now() - SERVICE_THRESHOLD_MIN * 60_000,
  ).toISOString();

  // TODO: if `employe_id` column is removed from transactions in the future,
  // mark all employees as PAUSE and update this query accordingly.
  const { data: recentSales } = await supabase
    .from('transactions')
    .select('employe_id, created_at')
    .in('employe_id', employeeIds)
    .gte('created_at', thresholdIso)
    .eq('statut', 'validee')
    .order('created_at', { ascending: false });

  const lastSaleMap = new Map<string, string>();
  for (const r of recentSales ?? []) {
    const eid = r.employe_id as string | null;
    if (eid && !lastSaleMap.has(eid)) {
      lastSaleMap.set(eid, r.created_at as string);
    }
  }

  // 4. Build rows
  const rows: PersonnelActivityRow[] = employes.map((e) => {
    const last = lastSaleMap.get(e.id as string) ?? null;
    const status: 'service' | 'pause' = last ? 'service' : 'pause';
    const prenom = (e.prenom as string) ?? '';
    const nom = (e.nom as string) ?? '';
    const initiales = ((prenom.charAt(0)) + (nom.charAt(0))).toUpperCase() || '??';
    const roleStr = ((e.role as string) ?? '').toLowerCase();
    const role_label = ROLE_LABEL_MAP[roleStr] ?? roleStr.toUpperCase();
    const boutiqueNom = boutiqueMap.get(e.boutique_id as string) ?? '';

    return {
      id: e.id as string,
      nom,
      prenom,
      initiales,
      role: e.role as string,
      role_label,
      boutique_id: e.boutique_id as string,
      boutique_nom: boutiqueNom.toUpperCase(),
      actif: true,
      last_sale_at: last,
      status,
    };
  });

  const nb_actifs = rows.filter((r) => r.status === 'service').length;
  const nb_total = rows.length;

  return { rows, nb_actifs, nb_total };
});
