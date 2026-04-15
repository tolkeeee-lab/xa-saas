import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getComparatif, type ComparatifPeriode } from '@/lib/supabase/getComparatif';
import ComparatifPage from '@/features/rapports/ComparatifPage';

export const metadata = { title: 'Comparatif boutiques — xà' };

const VALID_PERIODES: ComparatifPeriode[] = ['ce_mois', 'mois_precedent', '3_mois'];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const params = await searchParams;
  const rawPeriode = params.periode ?? 'ce_mois';
  const periode: ComparatifPeriode = VALID_PERIODES.includes(rawPeriode as ComparatifPeriode)
    ? (rawPeriode as ComparatifPeriode)
    : 'ce_mois';

  const data = await getComparatif(user.id, periode);

  return (
    <ComparatifPage
      boutiques={data.boutiques}
      boutiquesLastPeriod={data.boutiquesLastPeriod}
      ruptures={data.ruptures}
      periode={periode}
    />
  );
}
