import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';
import { createAdminClient } from '@/lib/supabase-admin';
import TopProduits from '@/features/admin-mafro/stats/TopProduits';
import TopPartenaires from '@/features/admin-mafro/stats/TopPartenaires';

export const metadata = { title: 'Statistiques — Admin MAFRO' };

export default async function AdminStatsPage() {
  await requireMafroAdmin();

  const admin = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: lignesData }, { data: commandesData }] = await Promise.all([
    admin
      .from('commandes_b2b_lignes')
      .select('produit_nom, quantite, total_ligne, commande_id'),
    admin
      .from('commandes_b2b')
      .select('id, boutique_id, total, statut, created_at')
      .gte('created_at', startOfMonth)
      .neq('statut', 'annulee'),
  ]);

  // Aggregate top produits
  const produitMap = new Map<string, { nom: string; quantite: number; ca: number }>();
  for (const l of lignesData ?? []) {
    const existing = produitMap.get(l.produit_nom) ?? { nom: l.produit_nom, quantite: 0, ca: 0 };
    existing.quantite += l.quantite;
    existing.ca += l.total_ligne;
    produitMap.set(l.produit_nom, existing);
  }
  const topProduits = Array.from(produitMap.values())
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 10);

  // Aggregate top partenaires
  const partenaireMap = new Map<string, { boutiqueId: string; nbCommandes: number; ca: number }>();
  for (const c of commandesData ?? []) {
    const existing = partenaireMap.get(c.boutique_id) ?? {
      boutiqueId: c.boutique_id,
      nbCommandes: 0,
      ca: 0,
    };
    existing.nbCommandes += 1;
    existing.ca += c.total;
    partenaireMap.set(c.boutique_id, existing);
  }

  // Fetch boutique names for top partenaires
  const topBoutiqueIds = Array.from(partenaireMap.values())
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 10)
    .map((p) => p.boutiqueId);

  const { data: boutiquesRaw } = topBoutiqueIds.length
    ? await admin.from('boutiques').select('id, nom').in('id', topBoutiqueIds)
    : { data: [] as { id: string; nom: string }[] };

  const boutiqueNameMap = new Map<string, string>(
    (boutiquesRaw ?? []).map((b) => [b.id, String(b.nom ?? b.id)]),
  );
  const topPartenaires = Array.from(partenaireMap.values())
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 10)
    .map((p) => ({
      boutiqueId: p.boutiqueId,
      nom: boutiqueNameMap.get(p.boutiqueId) ?? p.boutiqueId.slice(0, 8),
      nbCommandes: p.nbCommandes,
      ca: p.ca,
    }));

  return (
    <div className="xa-admin-page">
      <div className="xa-admin-page__header">
        <h1 className="xa-admin-page__title">Statistiques</h1>
        <p className="xa-admin-page__subtitle">
          {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </p>
      </div>
      <div className="xa-admin-stats-grid">
        <TopProduits produits={topProduits} />
        <TopPartenaires partenaires={topPartenaires} />
      </div>
    </div>
  );
}
