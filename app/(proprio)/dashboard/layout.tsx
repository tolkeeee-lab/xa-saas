import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { NotifProvider } from '@/context/NotifContext';
import DashboardLoading from './loading';
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

  const [{ data: profileData }, boutiques] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getBoutiques(user.id),
  ]);

  const profile = profileData as Profile | null;
  const isSuperAdmin = user.email === process.env.SUPER_ADMIN_EMAIL;

  return (
    <NotifProvider>
      <div className="flex h-screen bg-xa-bg overflow-hidden">
        <Sidebar boutiques={boutiques} profile={profile} isSuperAdmin={isSuperAdmin} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Topbar />
          <OfflineBanner />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            <Suspense fallback={<DashboardLoading />}>
              {children}
            </Suspense>
          </main>
        </div>
        <MobileNav />
        <KeyboardShortcuts />
      </div>
    </NotifProvider>
  );
} 
