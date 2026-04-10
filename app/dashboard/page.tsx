'use client';
import { useAuth } from '../../lib/auth/AuthContext';

export default function DashboardPage() {
  const { session, logout } = useAuth();

  return (
    <main className="min-h-screen bg-xa-bg p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-xa-primary">xà</h1>
            <p className="text-sm text-gray-500">{session?.boutique.nom} · {session?.boutique.ville}</p>
          </div>
          <button onClick={logout} className="text-sm text-red-500 border border-red-200 rounded-lg px-3 py-1 hover:bg-red-50 transition">
            Déconnexion
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Connecté en tant que</p>
          <p className="font-bold text-gray-800 text-lg">{session?.employe.nom}{session?.employe.prenom ? ` ${session.employe.prenom}` : ''}</p>
          <span className="inline-block mt-1 text-xs bg-xa-primary/10 text-xa-primary rounded-full px-2 py-0.5 capitalize">{session?.employe.role}</span>
        </div>

        <p className="text-center text-gray-400 text-sm mt-10">Dashboard en construction 🚧</p>
      </div>
    </main>
  );
}
