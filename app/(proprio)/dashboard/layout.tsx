import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import OfflineBanner from '@/components/ui/OfflineBanner';
import DashboardBottomBar from '@/features/dashboard/DashboardBottomBar';
import { NotifProvider } from '@/context/NotifContext';

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

  return (
    <NotifProvider>
      <OfflineBanner />
      <div className="xa-dashboard-content">{children}</div>
      <DashboardBottomBar />
      <KeyboardShortcuts />
    </NotifProvider>
  );
}


