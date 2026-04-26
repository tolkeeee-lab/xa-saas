import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const revalidate = 60;

export type DashboardKpis = {
  ca_jour: number;
  ca_hier: number;
  ca_jour_trend: number;
  nb_ventes: number;
  panier_moyen: number;
  dettes_total: number;
  stock_bas_count: number;
  b2b_attente: number;
};

export type DashboardAlerte = {
  type: 'stock' | 'peremption' | 'dette' | 'b2b';
  count: number;
  href: string;
  label: string;
};

export type DashboardActiviteItem = {
  id: string;
  type: string;
  description: string;
  montant: number;
  created_at: string;
};

export type DashboardTopProduit = {
  produit_id: string;
  nom: string;
  qte: number;
  ca: number;
};

export type DashboardCA7j = {
  date: string;
  ca: number;
};

export type DashboardHomeData = {
  kpis: DashboardKpis;
  alertes: DashboardAlerte[];
  activite_recente: DashboardActiviteItem[];
  top_produits: DashboardTopProduit[];
  ca_7_jours: DashboardCA7j[];
};

// GET /api/dashboard/home?boutique_id=xxx
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const boutiqueIdParam = searchParams.get('boutique_id');

  // Resolve boutique IDs for this owner
  const { data: boutiquesData } = await supabase
    .from('boutiques')
    .select('id')
    .eq('proprietaire_id', user.id)
    .eq('actif', true);

  const allIds = (boutiquesData ?? []).map((b) => b.id as string);
  const boutiqueIds =
    boutiqueIdParam && allIds.includes(boutiqueIdParam) ? [boutiqueIdParam] : allIds;

  if (!boutiqueIds.length) {
    const empty: DashboardHomeData = {
      kpis: { ca_jour: 0, ca_hier: 0, ca_jour_trend: 0, nb_ventes: 0, panier_moyen: 0, dettes_total: 0, stock_bas_count: 0, b2b_attente: 0 },
      alertes: [],
      activite_recente: [],
      top_produits: [],
      ca_7_jours: [],
    };
    return NextResponse.json(empty, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { data: txToday },
    { data: txHier },
    { data: produits },
    { data: dettes },
    { data: commandesB2B },
    { data: tx7jours },
    { data: txRecentRaw },
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, montant_total')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('transactions')
      .select('montant_total')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', todayStart.toISOString()),
    supabase
      .from('produits')
      .select('id, nom, stock_actuel, seuil_alerte, date_peremption')
      .in('boutique_id', boutiqueIds)
      .eq('actif', true),
    supabase
      .from('dettes')
      .select('montant, montant_rembourse, statut')
      .in('boutique_id', boutiqueIds),
    supabase
      .from('commandes_b2b')
      .select('id')
      .in('boutique_id', boutiqueIds)
      .in('statut', ['soumise', 'confirmee']),
    supabase
      .from('transactions')
      .select('created_at, montant_total')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('transactions')
      .select('id, montant_total, client_nom, mode_paiement, created_at')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const caJour = (txToday ?? []).reduce((s, t) => s + ((t.montant_total as number) ?? 0), 0);
  const caHier = (txHier ?? []).reduce((s, t) => s + ((t.montant_total as number) ?? 0), 0);
  const caJourTrend = caHier > 0 ? Math.round(((caJour - caHier) / caHier) * 100) : 0;
  const nbVentes = (txToday ?? []).length;
  const panierMoyen = nbVentes > 0 ? Math.round(caJour / nbVentes) : 0;

  const dettesTotal = (dettes ?? []).reduce((s, d) => {
    const restant = ((d.montant as number) ?? 0) - ((d.montant_rembourse as number) ?? 0);
    return s + (restant > 0 ? restant : 0);
  }, 0);

  const allProduits = produits ?? [];
  const stockBasCount = allProduits.filter((p) => {
    const stock = (p.stock_actuel as number) ?? 0;
    const seuil = (p.seuil_alerte as number) ?? 0;
    return stock <= seuil;
  }).length;

  const b2bAttente = (commandesB2B ?? []).length;

  const kpis: DashboardKpis = {
    ca_jour: caJour,
    ca_hier: caHier,
    ca_jour_trend: caJourTrend,
    nb_ventes: nbVentes,
    panier_moyen: panierMoyen,
    dettes_total: dettesTotal,
    stock_bas_count: stockBasCount,
    b2b_attente: b2bAttente,
  };

  // ── Alertes ─────────────────────────────────────────────────────────────────
  const stockRuptureCount = allProduits.filter((p) => ((p.stock_actuel as number) ?? 0) === 0).length;

  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  const perimCount = allProduits.filter((p) => {
    if (!p.date_peremption) return false;
    const exp = new Date(p.date_peremption as string);
    return exp >= now && exp <= in7Days;
  }).length;

  const detteRetardCount = (dettes ?? []).filter((d) => d.statut === 'en_retard').length;

  const alertes: DashboardAlerte[] = [];
  if (stockRuptureCount > 0) {
    alertes.push({ type: 'stock', count: stockRuptureCount, href: '/dashboard/stock?filtre=rupture', label: `${stockRuptureCount} produit${stockRuptureCount > 1 ? 's' : ''} en rupture` });
  } else if (stockBasCount > 0) {
    alertes.push({ type: 'stock', count: stockBasCount, href: '/dashboard/stock?filtre=bas', label: `${stockBasCount} produit${stockBasCount > 1 ? 's' : ''} stock bas` });
  }
  if (perimCount > 0) {
    alertes.push({ type: 'peremption', count: perimCount, href: '/dashboard/perimes', label: `${perimCount} produit${perimCount > 1 ? 's' : ''} périssent dans 7j` });
  }
  if (detteRetardCount > 0) {
    // The 'en_retard' status is managed by database triggers/cron based on the 30-day threshold
    alertes.push({ type: 'dette', count: detteRetardCount, href: '/dashboard/dettes', label: `${detteRetardCount} dette${detteRetardCount > 1 ? 's' : ''} en retard >30j` });
  }
  if (b2bAttente > 0) {
    alertes.push({ type: 'b2b', count: b2bAttente, href: '/dashboard/b2b', label: `${b2bAttente} commande${b2bAttente > 1 ? 's' : ''} B2B nouvelle${b2bAttente > 1 ? 's' : ''}` });
  }

  // ── Activité récente ─────────────────────────────────────────────────────────
  const activite_recente: DashboardActiviteItem[] = (txRecentRaw ?? []).map((t) => ({
    id: t.id as string,
    type: 'vente',
    description: t.client_nom ? `Vente — ${t.client_nom as string}` : 'Vente comptoir',
    montant: (t.montant_total as number) ?? 0,
    created_at: t.created_at as string,
  }));

  // ── Top produits du jour ─────────────────────────────────────────────────────
  const txTodayIds = (txToday ?? []).map((t) => t.id as string);
  let top_produits: DashboardTopProduit[] = [];

  if (txTodayIds.length > 0) {
    const { data: lignes } = await supabase
      .from('transaction_lignes')
      .select('produit_id, nom_produit, quantite, sous_total')
      .in('transaction_id', txTodayIds);

    if (lignes?.length) {
      const aggMap: Record<string, { nom: string; qte: number; ca: number }> = {};
      for (const l of lignes) {
        const key = (l.produit_id as string | null) ?? `__nom__${(l.nom_produit as string) || 'unknown'}`;
        const existing = aggMap[key];
        if (existing) {
          existing.qte += (l.quantite as number) ?? 0;
          existing.ca += (l.sous_total as number) ?? 0;
        } else {
          aggMap[key] = {
            nom: (l.nom_produit as string) ?? 'Produit',
            qte: (l.quantite as number) ?? 0,
            ca: (l.sous_total as number) ?? 0,
          };
        }
      }

      top_produits = Object.entries(aggMap)
        .sort((a, b) => b[1].qte - a[1].qte)
        .slice(0, 5)
        .map(([key, v]) => ({
          produit_id: key.startsWith('__nom__') ? '' : key,
          nom: v.nom,
          qte: v.qte,
          ca: v.ca,
        }));
    }
  }

  // ── CA 7 jours ──────────────────────────────────────────────────────────────
  const ca7jMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    ca7jMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const tx of tx7jours ?? []) {
    const dateKey = (tx.created_at as string).slice(0, 10);
    if (dateKey in ca7jMap) {
      ca7jMap[dateKey] += (tx.montant_total as number) ?? 0;
    }
  }
  const ca_7_jours: DashboardCA7j[] = Object.entries(ca7jMap).map(([date, ca]) => ({ date, ca }));

  return NextResponse.json<DashboardHomeData>(
    { kpis, alertes, activite_recente, top_produits, ca_7_jours },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  );
}
