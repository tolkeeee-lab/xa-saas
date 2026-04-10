'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase-browser';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomBoutique, setNomBoutique] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nom_boutique: nomBoutique },
      },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Erreur lors de l'inscription");
      setLoading(false);
      return;
    }

    // Boutique créée automatiquement par le trigger SQL on_auth_user_created
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-xa-primary mb-1 text-center">xà</h1>
        <p className="text-gray-500 text-sm mb-8 text-center">Créez votre espace</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
            <input type="text" value={nomBoutique} onChange={e => setNomBoutique(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" placeholder="Ma boutique" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" placeholder="vous@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white" placeholder="6 caractères minimum" />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-xa-primary text-white font-semibold rounded-xl py-3 mt-2 hover:bg-xa-primary/90 transition disabled:opacity-50">
            {loading ? 'Création...' : 'Créer mon espace'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-xa-primary font-medium">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}