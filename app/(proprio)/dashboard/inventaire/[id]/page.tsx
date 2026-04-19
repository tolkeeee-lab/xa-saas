import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getInventaire } from '@/lib/supabase/getInventaires';
import ComptageScreen from '@/features/inventaire/ComptageScreen';

export const metadata = { title: 'Comptage inventaire — xà' };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const inventaire = await getInventaire(user.id, id);
  if (!inventaire) redirect('/dashboard/inventaire');

  return <ComptageScreen inventaire={inventaire} />;
}
