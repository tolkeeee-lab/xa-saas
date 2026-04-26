import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import DashboardHomeScreen from '@/features/dashboard/DashboardHomeScreen';
import type { Profile } from '@/types/database';

type PageProps = {
  searchParams: Promise<{ boutique_id?: string }>;
};

export const metadata = { title: 'Tableau de bord — xà' };

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [boutiquesRaw, profileData] = await Promise.all([
    getBoutiques(user.id),
    supabase.from('profiles').select('nom_complet').eq('id', user.id).single(),
  ]);

  const profile = (profileData.data as Pick<Profile, 'nom_complet'>) ?? null;

  const boutiques = boutiquesRaw.map((b) => ({
    id: b.id,
    nom: b.nom,
    couleur_theme: b.couleur_theme,
  }));

  // Resolve searchParams on the server so the client component gets the
  // initial boutique_id from the URL for its first render.
  const resolvedParams = await searchParams;
  const initialBoutiqueId = resolvedParams.boutique_id ?? null;

  return (
    <div className="xa-home-page">
      <Suspense>
        <DashboardHomeScreen
          profile={profile}
          boutiques={boutiques}
          initialBoutiqueId={initialBoutiqueId}
        />
      </Suspense>
    </div>
  );
}
