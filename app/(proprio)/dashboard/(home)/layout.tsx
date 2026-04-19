import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import DashboardShell from '@/components/dashboard/shell/DashboardShell';
import LeftColumnServer from '@/components/dashboard/shell/LeftColumnServer';
import RightColumnServer from '@/components/dashboard/shell/RightColumnServer';
import LeftColumnSkeleton from '@/components/dashboard/shell/LeftColumnSkeleton';
import RightColumnSkeleton from '@/components/dashboard/shell/RightColumnSkeleton';
import DashboardLoading from '../loading';

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const boutiques = await getBoutiques(user.id);

  return (
    <DashboardShell
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
  );
}
