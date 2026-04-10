'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const auth = document.cookie.split(';').some(c => c.trim() === 'xa_authenticated=true');
    router.replace(auth ? '/dashboard' : '/auth/boutique');
  }, [router]);
  return (
    <main className="min-h-screen bg-xa-bg flex items-center justify-center">
      <p className="text-gray-400">Chargement...</p>
    </main>
  );
}
