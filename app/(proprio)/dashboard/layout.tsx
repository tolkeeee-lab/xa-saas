import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import OfflineBanner from '@/components/ui/OfflineBanner';
import DashboardShell from '@/components/dashboard/shell/DashboardShell';
import LeftColumnServer from '@/components/dashboard/shell/LeftColumnServer';
import RightColumnServer from '@/components/dashboard/shell/RightColumnServer';
import LeftColumnSkeleton from '@/components/dashboard/shell/LeftColumnSkeleton';
import RightColumnSkeleton from '@/components/dashboard/shell/RightColumnSkeleton';
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

  // Compute user initials for the avatar
  const fullName = profile?.nom_complet ?? user.email ?? '';
  const initials = fullName
    .split(' ')
    .filter((part: string) => part.trim().length > 0)
    .map((part: string) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('') || 'XA';

  return (
    <>
      <OfflineBanner />
      <DashboardShell
        userInitials={initials}
        boutiques={boutiques}
        leftColumn={
          <Suspense fallback={<LeftColumnSkeleton />}>
            <LeftColumnServer userId={user.id} />
          </Suspense>
        }
        centerColumn={
          <Suspense fallback={<DashboardLoading />}>
            <main className="p-4 md:p-6">{children}</main>
          </Suspense>
        }
        rightColumn={
          <Suspense fallback={<RightColumnSkeleton />}>
            <RightColumnServer userId={user.id} />
          </Suspense>
        }
      />
      <KeyboardShortcuts />
    </>
  );
} 
