import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Card from '@/components/ui/Card';
import PriceTag from '@/components/ui/PriceTag';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? '';
  if (!user || user.email !== superAdminEmail) redirect('/login');

  const { data: boutiques } = await supabaseAdmin
    .from('boutiques')
    .select('id, nom, ville, actif, created_at')
    .order('created_at', { ascending: false });

  const { count: nbTransactions } = await supabaseAdmin
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'validee');

  const { data: montantData } = await supabaseAdmin
    .from('transactions')
    .select('montant_total')
    .eq('statut', 'validee')
    .in('type', ['vente', 'credit']);

  const totalCA = (montantData ?? []).reduce((sum, t) => sum + t.montant_total, 0);

  return (
    <main className="min-h-screen bg-xa-bg px-4 py-6 max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-xa-primary">xà — Super Admin</h1>
        <p className="text-xs text-gray-400">God Mode 👁</p>
      </div>

      <section className="grid grid-cols-2 gap-3 mb-6">
        <Card title="Boutiques actives">
          <span className="text-2xl font-bold text-xa-primary">{boutiques?.filter(b => b.actif).length ?? 0}</span>
        </Card>
        <Card title="Transactions">
          <span className="text-2xl font-bold text-gray-900">{nbTransactions ?? 0}</span>
        </Card>
        <Card title="CA global" className="col-span-2">
          <PriceTag amount={totalCA} size="lg" color="primary" />
        </Card>
      </section>

      <Card title="Boutiques récentes">
        <div className="space-y-2">
          {(boutiques ?? []).slice(0, 20).map(b => (
            <div key={b.id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{b.nom}</p>
                <p className="text-xs text-gray-400">{b.ville ?? '—'} · {new Date(b.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <span className={['text-xs px-2 py-0.5 rounded-full font-medium', b.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'].join(' ')}>
                {b.actif ? 'actif' : 'inactif'}
              </span>
            </div>
          ))}
          {!boutiques?.length && <p className="text-sm text-gray-400">Aucune boutique.</p>}
        </div>
      </Card>
    </main>
  );
}
