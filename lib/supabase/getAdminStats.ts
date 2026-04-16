import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-admin';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AdminBoutique = {
  id: string;
  nom: string;
  ville: string;
  actif: boolean;
  type?: string;
};

export type AdminUser = {
  id: string;
  nom_complet: string | null;
  telephone: string | null;
  role: 'super_admin' | 'proprio';
  created_at: string;
  boutiques_count: number;
  boutiques: AdminBoutique[];
  ca_mois: number;
  employes_count: number;
  status: 'active' | 'trial' | 'suspended';
};

export type AdminActivity = {
  id: string;
  boutique_nom: string;
  proprietaire_nom: string | null;
  montant_total: number;
  created_at: string;
};

export type AdminStats = {
  users: AdminUser[];
  total_users: number;
  active_users: number;
  trial_users: number;
  boutiques_total: number;
  ca_reseau: number;
  mrr: number;
  villes: { ville: string; count: number }[];
};

// ─── getAdminStats ────────────────────────────────────────────────────────────

export function getAdminStats(): Promise<AdminStats> {
  return unstable_cache(
    async () => {
      const admin = createAdminClient();

      // 1. Fetch all proprio profiles
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, role, nom_complet, telephone, created_at, updated_at')
        .eq('role', 'proprio')
        .order('created_at', { ascending: false });

      if (!profiles || profiles.length === 0) {
        return {
          users: [],
          total_users: 0,
          active_users: 0,
          trial_users: 0,
          boutiques_total: 0,
          ca_reseau: 0,
          mrr: 0,
          villes: [],
        };
      }

      const profileIds = profiles.map((p) => p.id);

      // 2. Fetch all boutiques for those owners
      const { data: allBoutiques } = await admin
        .from('boutiques')
        .select('id, proprietaire_id, nom, ville, actif')
        .in('proprietaire_id', profileIds);

      // 3. Fetch CA du mois en cours
      const now = new Date();
      const debutMois = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

      const boutiqueIds = (allBoutiques ?? []).map((b) => b.id);

      const { data: transactions } =
        boutiqueIds.length > 0
          ? await admin
              .from('transactions')
              .select('boutique_id, montant_total')
              .in('boutique_id', boutiqueIds)
              .eq('statut', 'validee')
              .gte('created_at', debutMois)
          : { data: [] as { boutique_id: string; montant_total: number }[] };

      // CA per boutique
      const caParBoutique: Record<string, number> = {};
      for (const tx of transactions ?? []) {
        caParBoutique[tx.boutique_id] = (caParBoutique[tx.boutique_id] ?? 0) + tx.montant_total;
      }

      // 4. Fetch employes count per boutique
      const { data: employes } =
        boutiqueIds.length > 0
          ? await admin
              .from('employes')
              .select('boutique_id')
              .in('boutique_id', boutiqueIds)
              .eq('actif', true)
          : { data: [] as { boutique_id: string }[] };

      const employesParBoutique: Record<string, number> = {};
      for (const emp of employes ?? []) {
        employesParBoutique[emp.boutique_id] = (employesParBoutique[emp.boutique_id] ?? 0) + 1;
      }

      // 5. Build AdminUser objects
      const users: AdminUser[] = profiles.map((p) => {
        const boutiques = (allBoutiques ?? []).filter((b) => b.proprietaire_id === p.id);
        const caMois = boutiques.reduce((sum, b) => sum + (caParBoutique[b.id] ?? 0), 0);
        const employesCount = boutiques.reduce(
          (sum, b) => sum + (employesParBoutique[b.id] ?? 0),
          0,
        );

        const hasActiveBoutique = boutiques.some((b) => b.actif);
        const inscritDepuis30j =
          Date.now() - new Date(p.created_at).getTime() < 30 * 24 * 3600 * 1000;

        let status: AdminUser['status'];
        if (!hasActiveBoutique) {
          status = 'suspended';
        } else if (inscritDepuis30j && caMois === 0) {
          status = 'trial';
        } else {
          status = 'active';
        }

        return {
          id: p.id,
          nom_complet: p.nom_complet,
          telephone: p.telephone,
          role: p.role,
          created_at: p.created_at,
          boutiques_count: boutiques.length,
          boutiques: boutiques.map((b) => ({
            id: b.id,
            nom: b.nom,
            ville: b.ville,
            actif: b.actif,
          })),
          ca_mois: caMois,
          employes_count: employesCount,
          status,
        };
      });

      // 6. Aggregate stats
      const total_users = users.length;
      const active_users = users.filter((u) => u.status === 'active').length;
      const trial_users = users.filter((u) => u.status === 'trial').length;
      const boutiques_total = (allBoutiques ?? []).filter((b) => b.actif).length;
      const ca_reseau = users.reduce((sum, u) => sum + u.ca_mois, 0);

      // Simulated MRR : Pro = 5000, Business = 15000
      const mrr = users.reduce((sum, u) => {
        if (u.status === 'suspended') return sum;
        if (u.ca_mois > 500000) return sum + 15000;
        if (u.ca_mois > 0) return sum + 5000;
        return sum;
      }, 0);

      // Villes
      const villeCount: Record<string, number> = {};
      for (const b of allBoutiques ?? []) {
        if (b.actif) {
          villeCount[b.ville] = (villeCount[b.ville] ?? 0) + 1;
        }
      }
      const villes = Object.entries(villeCount)
        .map(([ville, count]) => ({ ville, count }))
        .sort((a, b) => b.count - a.count);

      return {
        users,
        total_users,
        active_users,
        trial_users,
        boutiques_total,
        ca_reseau,
        mrr,
        villes,
      };
    },
    ['admin-stats'],
    { revalidate: 60, tags: ['admin-stats'] },
  )();
}

// ─── getAdminActivity ─────────────────────────────────────────────────────────

export function getAdminActivity(limit: number): Promise<AdminActivity[]> {
  return unstable_cache(
    async () => {
      const admin = createAdminClient();

      const { data: transactions } = await admin
        .from('transactions')
        .select('id, boutique_id, montant_total, created_at')
        .eq('statut', 'validee')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!transactions || transactions.length === 0) return [];

      const boutiqueIds = [...new Set(transactions.map((t) => t.boutique_id))];

      const { data: boutiques } = await admin
        .from('boutiques')
        .select('id, nom, proprietaire_id')
        .in('id', boutiqueIds);

      const proprietaireIds = [...new Set((boutiques ?? []).map((b) => b.proprietaire_id))];

      const { data: profiles } =
        proprietaireIds.length > 0
          ? await admin.from('profiles').select('id, nom_complet').in('id', proprietaireIds)
          : { data: [] as { id: string; nom_complet: string | null }[] };

      const boutiqueMap: Record<string, { nom: string; proprietaire_id: string }> = {};
      for (const b of boutiques ?? []) {
        boutiqueMap[b.id] = { nom: b.nom, proprietaire_id: b.proprietaire_id };
      }

      const profileMap: Record<string, string | null> = {};
      for (const p of profiles ?? []) {
        profileMap[p.id] = p.nom_complet;
      }

      return transactions.map((t) => {
        const boutique = boutiqueMap[t.boutique_id];
        return {
          id: t.id,
          boutique_nom: boutique?.nom ?? 'Boutique inconnue',
          proprietaire_nom: boutique ? (profileMap[boutique.proprietaire_id] ?? null) : null,
          montant_total: t.montant_total,
          created_at: t.created_at,
        };
      });
    },
    ['admin-activity', String(limit)],
    { revalidate: 60, tags: ['admin-stats'] },
  )();
}
