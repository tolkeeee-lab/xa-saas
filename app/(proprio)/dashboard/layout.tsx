import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import OfflineBanner from '@/components/ui/OfflineBanner';
import DashboardTopbar from '@/components/dashboard/shell/DashboardTopbar';
import { NotifProvider } from '@/context/NotifContext';
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

  // Compute user initials for the avatar
  const fullName = profile?.nom_complet ?? user.email ?? '';
  const initials =
    fullName
      .split(' ')
      .filter((part: string) => part.trim().length > 0)
      .map((part: string) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || 'XA';

  return (
    <NotifProvider>
      <OfflineBanner />
      <DashboardTopbar userInitials={initials} />
      <div className="xa-dashboard-content">{children}</div>
      <KeyboardShortcuts />
    </NotifProvider>
  );
}

