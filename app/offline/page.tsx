export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-xa-bg flex items-center justify-center p-4">
      <div className="bg-xa-surface border border-xa-border rounded-xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-xa-primary/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-xa-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 6.343a9 9 0 000 12.728M9.172 9.172a5 5 0 000 7.072M12 12h.01"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-xa-text">Vous êtes hors ligne</h1>
        <p className="text-xa-muted text-sm leading-relaxed">
          Les ventes en attente seront synchronisées au retour de la connexion.
          La caisse reste disponible en mode hors-ligne.
        </p>
        <a
          href="/dashboard/caisse"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Accéder à la caisse
        </a>
      </div>
    </div>
  );
}
