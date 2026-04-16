// SQL migration (run once in Supabase SQL editor):
// create table if not exists clotures_caisse (
//   id uuid primary key default gen_random_uuid(),
//   boutique_id uuid references boutiques(id) not null,
//   proprietaire_id uuid references auth.users(id) not null,
//   date date not null,
//   ca_theorique numeric not null default 0,
//   cash_theorique numeric not null default 0,
//   cash_reel numeric not null default 0,
//   ecart numeric generated always as (cash_reel - cash_theorique) stored,
//   nb_transactions integer not null default 0,
//   par_mode jsonb not null default '{}',
//   note text,
//   created_at timestamptz default now(),
//   unique(boutique_id, date)
// );

import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import type { Boutique } from '@/types/database';

export type ClotureCaisseRow = {
  id: string;
  boutique_id: string;
  boutique_nom: string;
  date: string;
  ca_theorique: number;
  cash_theorique: number;
  cash_reel: number;
  ecart: number;
  nb_transactions: number;
  par_mode: Record<string, number>;
  note: string | null;
  created_at: string;
};

export type ClotureCaissePageData = {
  boutiques: Pick<Boutique, 'id' | 'nom' | 'couleur_theme'>[];
  historique: ClotureCaisseRow[];
};

export function getClotureCaisseData(userId: string): Promise<ClotureCaissePageData> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      const { data: boutiques } = await supabase
        .from('boutiques')
        .select('id, nom, couleur_theme')
        .eq('proprietaire_id', userId)
        .eq('actif', true);

      if (!boutiques?.length) {
        return { boutiques: [], historique: [] };
      }

      const boutiqueIds = boutiques.map((b) => b.id);
      const boutiqueMap = new Map(boutiques.map((b) => [b.id, b.nom]));

      try {
        const { data: clotures, error } = await supabase
          .from('clotures_caisse')
          .select('id, boutique_id, date, ca_theorique, cash_theorique, cash_reel, ecart, nb_transactions, par_mode, note, created_at')
          .in('boutique_id', boutiqueIds)
          .order('date', { ascending: false })
          .limit(30);

        if (error) {
          return { boutiques, historique: [] };
        }

        const historique: ClotureCaisseRow[] = (clotures ?? []).map((c) => ({
          id: c.id,
          boutique_id: c.boutique_id,
          boutique_nom: boutiqueMap.get(c.boutique_id) ?? '',
          date: c.date,
          ca_theorique: c.ca_theorique,
          cash_theorique: c.cash_theorique,
          cash_reel: c.cash_reel,
          ecart: c.ecart,
          nb_transactions: c.nb_transactions,
          par_mode: (c.par_mode as Record<string, number>) ?? {},
          note: c.note ?? null,
          created_at: c.created_at ?? '',
        }));

        return { boutiques, historique };
      } catch {
        return { boutiques, historique: [] };
      }
    },
    ['cloture-caisse', userId],
    { revalidate: 60, tags: [`cloture-caisse-${userId}`] },
  )();
}
