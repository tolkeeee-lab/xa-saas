import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    redirect('/login');
  }

  return (
    <div className="dark" style={{ colorScheme: 'dark' }}>
      {children}
    </div>
  );
}
