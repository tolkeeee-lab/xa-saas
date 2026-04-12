import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getRapports, getRapportsPeriode } from '@/lib/supabase/getRapports';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import RapportsPage from '@/components/dashboard/RapportsPage';
import TopProduitsPage from '@/components/dashboard/TopProduitsPage';

export default async function RapportsServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const now = new Date();
  const dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [rapports, periodeData, boutiques] = await Promise.all([
    getRapports(user.id),
    getRapportsPeriode(user.id, dateDebut, dateFin),
    getBoutiques(user.id),
  ]);

  return (
    <div className="space-y-10">
      <RapportsPage
        data={rapports}
        periodeData={periodeData}
        initialDateDebut={dateDebut}
        initialDateFin={dateFin}
      />
      <TopProduitsPage boutiques={boutiques} />
    </div>
  );
}

