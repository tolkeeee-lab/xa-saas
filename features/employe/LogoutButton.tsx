'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/employe/session', { method: 'DELETE' });
    router.push('/');
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className="px-4 py-2 rounded-lg border border-xa-border text-xa-muted text-sm hover:bg-xa-bg transition-colors"
    >
      Se déconnecter
    </button>
  );
}
