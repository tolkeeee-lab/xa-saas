import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import OfflineBanner from '@/components/ui/OfflineBanner';
import DashboardBottomBar from '@/features/dashboard/DashboardBottomBar';
import { NotifProvider } from '@/context/NotifContext';
import ThemeToggle from '@/components/ui/ThemeToggle';

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
      {/* Floating theme toggle — toujours visible sur toutes les pages dashboard */}
      <div className="fixed top-3 right-3 z-50 xa-theme-toggle-float">
        <ThemeToggle />
      </div>
      <div className="xa-dashboard-content">{children}</div>
      <DashboardBottomBar />
      <KeyboardShortcuts />
    </NotifProvider>
  );
}


