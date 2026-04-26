import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import AdminSidebar from '@/features/admin-mafro/AdminSidebar';
import AdminTopbar from '@/features/admin-mafro/AdminTopbar';

export const metadata = { title: 'Admin MAFRO — xà' };

export default async function AdminMafroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: adminRow } = await admin
    .from('mafro_admins')
    .select('id, nom, est_actif')
    .eq('user_id', user.id)
    .eq('est_actif', true)
    .maybeSingle();

  if (!adminRow) {
    redirect('/dashboard?toast=mafro_access_denied');
  }

  return (
    <div className="xa-admin-mafro">
      <AdminSidebar />
      <div className="xa-admin-mafro__main">
        <AdminTopbar userName={adminRow.nom} />
        <main className="xa-admin-mafro__content">{children}</main>
      </div>
    </div>
  );
}
