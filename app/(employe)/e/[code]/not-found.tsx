import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-xa-bg px-4">
      <div className="bg-xa-surface border border-xa-border rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
        <p className="text-4xl mb-4">🔗</p>
        <h1 className="text-lg font-bold text-xa-text mb-2">Lien invalide ou expiré</h1>
        <p className="text-sm text-xa-muted mb-6">
          Demande un nouveau lien d&apos;accès à ton patron.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
