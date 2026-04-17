import type { Transaction, Boutique } from '@/types/database';
import { formatFCFA } from '@/lib/format';

type TransactionFluxProps = {
  transactions: Transaction[];
  boutiques: Boutique[];
};

export default function TransactionFlux({
  transactions,
  boutiques,
}: TransactionFluxProps) {
  const boutiqueMap = new Map(boutiques.map((b) => [b.id, b]));

  return (
    <div className="bg-xa-surface border border-xa-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-xa-text">Flux transactions</h3>
        <span className="flex items-center gap-1.5 text-xs text-aquamarine-600 font-semibold">
          <span className="w-2 h-2 rounded-full bg-aquamarine-500 animate-pulse" />
          En direct
        </span>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-xa-muted text-center py-8">
          Aucune transaction aujourd&apos;hui
        </p>
      ) : (
        <div className="divide-y divide-xa-border overflow-y-auto max-h-[280px]">
          {transactions.map((t) => {
            const boutique = boutiqueMap.get(t.boutique_id);
            const time = new Date(t.created_at).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div key={t.id} className="flex items-center gap-3 py-2.5">
                <span className="text-xs text-xa-muted w-10 shrink-0">{time}</span>
                {boutique && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded text-white shrink-0 max-w-[70px] truncate"
                    style={{ backgroundColor: boutique.couleur_theme }}
                  >
                    {boutique.nom}
                  </span>
                )}
                <span className="text-xs text-xa-muted flex-1 truncate capitalize">
                  {t.client_nom ?? t.mode_paiement}
                </span>
                <span className="text-sm font-bold text-xa-text shrink-0">
                  {formatFCFA(t.montant_total)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
