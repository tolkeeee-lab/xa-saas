import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import type { Boutique } from '@/types/database';

export default async function BoutiquesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const boutiques = await getBoutiques(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-xa-muted">{boutiques.length} boutique(s)</p>
        <Link
          href="/dashboard/boutiques/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une boutique
        </Link>
      </div>

      {boutiques.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <svg
            className="w-12 h-12 text-xa-muted mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="text-xa-muted mb-4">Aucune boutique pour l&apos;instant.</p>
          <Link
            href="/dashboard/boutiques/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Créer ma première boutique
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {boutiques.map((boutique: Boutique) => (
            <BoutiqueListCard key={boutique.id} boutique={boutique} />
          ))}
        </div>
      )}
    </div>
  );
}

function BoutiqueListCard({ boutique }: { boutique: Boutique }) {
  return (
    <div
      className="bg-xa-surface border border-xa-border rounded-xl p-5 flex flex-col gap-4"
      style={{ borderTopColor: boutique.couleur_theme, borderTopWidth: '3px' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-xa-text">{boutique.nom}</h3>
          <p className="text-xs text-xa-muted mt-0.5">
            {boutique.ville}
            {boutique.quartier ? ` · ${boutique.quartier}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-emerald-500 font-medium">Actif</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-xa-muted">Code :</span>
        <code className="text-xs font-mono font-semibold text-xa-primary bg-xa-bg px-2 py-0.5 rounded">
          {boutique.code_unique}
        </code>
      </div>

      <div className="flex items-center gap-1.5 pt-2 border-t border-xa-border">
        <div
          className="w-4 h-4 rounded border border-xa-border"
          style={{ backgroundColor: boutique.couleur_theme }}
        />
        <span className="text-xs text-xa-muted">{boutique.couleur_theme}</span>
      </div>

      <div className="flex gap-2">
        <Link
          href="/dashboard/caisse"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-xa-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Ouvrir caisse
        </Link>
        <Link
          href="/dashboard/parametres"
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-xa-border text-xa-text text-xs font-medium hover:bg-xa-bg transition-colors"
        >
          Paramètres
        </Link>
      </div>
    </div>
  );
}