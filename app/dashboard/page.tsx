import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase-server';

async function signOut() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('*')
    .eq('proprietaire_id', user.id)
    .eq('actif', true)
    .order('created_at');

  return (
    <main className="min-h-screen bg-xa-bg p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-xa-primary">xà</h1>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/caisse" className="text-sm bg-xa-accent text-white rounded-lg px-3 py-1.5 font-medium hover:bg-xa-accent/90 transition">
              Caisse
            </Link>
            <Link href="/dashboard/parametres" className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
              ⚙️ Paramètres
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-sm text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition">
                Déconnexion
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Mes boutiques</h2>
          <Link href="/dashboard/boutiques/new" className="text-sm text-xa-primary font-medium">+ Ajouter</Link>
        </div>

        {(!boutiques || boutiques.length === 0) ? (
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <p className="text-gray-400 text-sm mb-3">Aucune boutique pour l&apos;instant</p>
            <Link href="/dashboard/boutiques/new" className="text-xa-primary text-sm font-medium">Créer ma première boutique →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {boutiques.map(b => (
              <div key={b.id} className="bg-white rounded-2xl shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{b.nom}</p>
                    {b.ville && <p className="text-xs text-gray-400">{b.ville}</p>}
                  </div>
                  <Link href={`/dashboard/employes?boutique_id=${b.id}`}
                    className="text-sm text-xa-primary border border-xa-primary/30 rounded-lg px-3 py-1 hover:bg-xa-primary/5 transition">
                    Employés
                  </Link>
                  <Link href={`/dashboard/produits?boutique_id=${b.id}`}
                    className="text-sm text-xa-primary border border-xa-primary/30 rounded-lg px-3 py-1 hover:bg-xa-primary/5 transition">
                    Produits
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
