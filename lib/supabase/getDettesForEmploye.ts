import { createAdminClient } from '@/lib/supabase-admin';
import type { Dette } from '@/types/database';
import type { EmployeSession } from '@/lib/employe-session';

export type DettesEmployeData = {
  dettes: Dette[];
  total_du: number;
  en_retard: number;
};

/**
 * Fetch debts scoped to the employee's boutique.
 */
export async function getDettesForEmploye(
  session: EmployeSession,
): Promise<DettesEmployeData> {
  const admin = createAdminClient();

  const { data } = await admin
    .from('dettes')
    .select(
      'id, boutique_id, client_nom, client_telephone, montant, montant_rembourse, description, statut, date_echeance, created_at',
    )
    .eq('boutique_id', session.boutique_id)
    .order('created_at', { ascending: false });

  const dettes: Dette[] = (data ?? []) as Dette[];

  const total_du = dettes
    .filter((d) => d.statut !== 'paye')
    .reduce((s, d) => s + (d.montant - d.montant_rembourse), 0);

  const en_retard = dettes.filter((d) => d.statut === 'en_retard').length;

  return { dettes, total_du, en_retard };
}
