import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getRapports, getRapportsPeriode } from '@/lib/supabase/getRapports';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import RapportsPage from '@/features/rapports/RapportsPage';
import TopProduitsPage from '@/features/rapports/TopProduitsPage';
import HubQuickLinks from '@/features/dashboard/HubQuickLinks';
import { FileBarChart, Scale } from 'lucide-react';

const RAPPORTS_LINKS = [
  { href: '/dashboard/rapports',   icon: FileBarChart, label: 'Synthèse',             description: 'Vue financière globale', isCurrent: true },
  { href: '/dashboard/comparatif', icon: Scale,        label: 'Comparatif boutiques', description: 'Perf. par boutique' },
];

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
      <HubQuickLinks items={RAPPORTS_LINKS} />
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

