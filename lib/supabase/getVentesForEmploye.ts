import { createAdminClient } from '@/lib/supabase-admin';
import type { Transaction } from '@/types/database';
import type { EmployeSession } from '@/lib/employe-session';

export type VenteEmploye = Omit<Transaction, 'benefice_total'> & {
  employe_nom: string | null;
};

export type VentesEmployeData = {
  ventes: VenteEmploye[];
  total_ca: number;
  total_ventes: number;
};

/**
 * Fetch transactions for the employee's boutique.
 * `benefice_total` is excluded for all roles except gérant.
 * Defaults to today's transactions.
 */
export async function getVentesForEmploye(
  session: EmployeSession,
  filters?: {
    date_start?: string;
    date_end?: string;
    employe_id?: string;
  },
): Promise<VentesEmployeData> {
  const admin = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);
  const dateStart = filters?.date_start ?? today;
  const dateEnd = filters?.date_end ?? today;

  let query = admin
    .from('transactions')
    .select('*')
    .eq('boutique_id', session.boutique_id)
    .eq('statut', 'validee')
    .gte('created_at', dateStart + 'T00:00:00')
    .lte('created_at', dateEnd + 'T23:59:59')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.employe_id) {
    query = query.eq('employe_id', filters.employe_id);
  }

  const { data: txData } = await query;
  const txRows = txData ?? [];

  // Fetch employee names separately for the IDs present
  const employeIds = [...new Set(txRows.map((t) => t.employe_id).filter(Boolean))];
  const employeNomMap: Record<string, string> = {};

  if (employeIds.length > 0) {
    const { data: emps } = await admin
      .from('employes')
      .select('id, nom, prenom')
      .in('id', employeIds as string[]);

    for (const emp of emps ?? []) {
      employeNomMap[emp.id] = `${emp.prenom} ${emp.nom}`;
    }
  }

  const ventes: VenteEmploye[] = txRows.map((t) => {
    // Exclude benefice_total for non-gérant roles server-side
    const { benefice_total: _b, ...rest } = t;
    void _b;
    return {
      ...rest,
      employe_nom: t.employe_id ? (employeNomMap[t.employe_id] ?? null) : null,
    };
  });

  const total_ca = ventes.reduce((s, t) => s + (t.montant_total ?? 0), 0);

  return { ventes, total_ca, total_ventes: ventes.length };
}
