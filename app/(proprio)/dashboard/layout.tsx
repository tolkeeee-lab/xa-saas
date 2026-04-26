import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import OfflineBanner from '@/components/ui/OfflineBanner';
import DashboardHeaderBar from '@/features/dashboard/DashboardHeaderBar';
import DashboardBottomBar from '@/features/dashboard/DashboardBottomBar';
import { NotifProvider } from '@/context/NotifContext';
import { computeInitials } from '@/lib/initials';
import type { Profile } from '@/types/database';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = profileData as Profile | null;

  const fullName = profile?.nom_complet ?? user.email ?? '';
  const initials = computeInitials(fullName);

  return (
    <NotifProvider>
      <OfflineBanner />
      <DashboardHeaderBar userInitials={initials} />
      <div className="xa-dashboard-content">{children}</div>
      <DashboardBottomBar />
      <KeyboardShortcuts />
    </NotifProvider>
  );
}


