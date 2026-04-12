import { getAdminStats, getAdminActivity } from '@/lib/supabase/getAdminStats';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const [stats, activity] = await Promise.all([
    getAdminStats(),
    getAdminActivity(50),
  ]);

  return <AdminDashboard stats={stats} activity={activity} />;
}
