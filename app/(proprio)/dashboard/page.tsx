import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Card from '@/components/ui/Card';
import PriceTag from '@/components/ui/PriceTag';
import { getDailyStats } from '@/lib/supabase/getDailyStats';
import { getInventoryValue } from '@/lib/supabase/getInventoryValue';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id, nom, ville, actif')
    .eq('proprietaire_id', user.id)
    .eq('actif', true)
    .order('created_at');

  const boutique = boutiques?.[0];

  const today = new Date().toISOString().slice(0, 10);
  const stats = boutique
    ? await getDailyStats(boutique.id, today + 'T00:00:00Z', today + 'T23:59:59Z').catch(() => [])
    : [];
  const todayStat = stats[0];

  const inventory = boutique
    ? await getInventoryValue(boutique.id).catch(() => ({ valeur_achat: 0, valeur_vente: 0, nb_produits: 0 }))
    : { valeur_achat: 0, valeur_vente: 0, nb_produits: 0 };

  return (
    <main className="min-h-screen bg-xa-bg px-4 py-6 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-xa-primary">xà</h1>
          <p className="text-sm text-gray-500">{boutique?.nom ?? 'Ma boutique'}</p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button className="text-sm text-gray-400 hover:text-xa-danger">Déconnexion</button>
        </form>
      </div>

      {!boutique && (
        <Card className="mb-4 border border-xa-accent/30 bg-xa-accent/5">
          <p className="text-sm text-gray-700">Vous n&apos;avez pas encore de boutique.</p>
          <a href="/dashboard/boutiques/new" className="text-xa-primary font-semibold text-sm mt-2 block">
            → Créer ma boutique
          </a>
        </Card>
      )}

      {/* Stats du jour */}
      <section className="grid grid-cols-2 gap-3 mb-6">
        <Card title="CA aujourd'hui">
          <PriceTag amount={todayStat?.chiffre_affaires ?? 0} size="lg" color="primary" />
        </Card>
        <Card title="Transactions">
          <span className="text-2xl font-bold text-gray-900">{todayStat?.nb_transactions ?? 0}</span>
        </Card>
        <Card title="Valeur stock">
          <PriceTag amount={inventory.valeur_vente} size="md" color="accent" />
        </Card>
        <Card title="Produits actifs">
          <span className="text-2xl font-bold text-gray-900">{inventory.nb_produits}</span>
        </Card>
      </section>

      {/* Navigation */}
      <nav className="space-y-2">
        {[
          { href: '/dashboard/produits', label: '📦 Produits & Stock' },
          { href: '/dashboard/employes', label: '👥 Employés' },
          { href: '/dashboard/boutiques/new', label: '🏪 Nouvelle boutique' },
          { href: '/dashboard/parametres', label: '⚙️ Paramètres' },
          { href: '/caisse', label: '🧾 Ouvrir la caisse', accent: true },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            className={[
              'block rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
              item.accent
                ? 'bg-xa-primary text-white hover:bg-xa-primary/90'
                : 'bg-white shadow-sm text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </main>
  );
}
