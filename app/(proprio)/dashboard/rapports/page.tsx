import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getRapports, getRapportsPeriode } from '@/lib/supabase/getRapports';
import RapportsPage from '@/components/dashboard/RapportsPage';

export default async function RapportsServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const now = new Date();
  const dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [rapports, periodeData] = await Promise.all([
    getRapports(user.id),
    getRapportsPeriode(user.id, dateDebut, dateFin),
  ]);

  return (
    <RapportsPage
      data={rapports}
      periodeData={periodeData}
      initialDateDebut={dateDebut}
      initialDateFin={dateFin}
    />
  );
}

