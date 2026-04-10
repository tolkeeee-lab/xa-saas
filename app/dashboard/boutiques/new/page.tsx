import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase-server';

async function addBoutique(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const nom = (formData.get('nom') as string).trim();
  const ville = (formData.get('ville') as string | null)?.trim() || null;
  const adresse = (formData.get('adresse') as string | null)?.trim() || null;
  const telephone = (formData.get('telephone') as string | null)?.trim() || null;

  if (!nom) return;

  const { error } = await supabase.from('boutiques').insert({
    nom,
    ville,
    adresse,
    telephone,
    proprietaire_id: user.id,
    actif: true,
  });

  if (error) throw new Error(error.message);

  redirect('/dashboard');
}

export default async function NewBoutiquePage() {
  return (
    <main className="min-h-screen bg-xa-bg p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-xa-primary">Nouvelle boutique</h1>
          <Link href="/dashboard" className="text-sm text-gray-400">← Retour</Link>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <form action={addBoutique} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                name="nom"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Nom de la boutique"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                name="ville"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Cotonou (optionnel)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                name="adresse"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Adresse (optionnel)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                name="telephone"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="+229 xx xx xx xx (optionnel)"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-xa-primary text-white font-semibold rounded-xl py-3 mt-2 hover:bg-xa-primary/90 transition"
            >
              Créer la boutique
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
