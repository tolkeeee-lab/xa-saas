'use client';

import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { createClient as createBrowserSupabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

type Props = {
  userName: string;
};

export default function AdminTopbar({ userName }: Props) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="xa-admin-topbar">
      <div className="xa-admin-topbar__left">
        <Link href="/admin-mafro" className="xa-admin-topbar__back">
          ← Accueil
        </Link>
      </div>
      <div className="xa-admin-topbar__right">
        <div className="xa-admin-topbar__user">
          <User size={16} />
          <span>{userName}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="xa-admin-topbar__signout"
          title="Se déconnecter"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
