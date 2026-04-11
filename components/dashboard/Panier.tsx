import { formatFCFA } from '@/lib/format';

export type PayMode = 'especes' | 'momo' | 'carte' | 'credit';

export type CartItem = {
  produit_id: string;
  nom: string;
  prix_vente: number;
  qty: number;
  stock_actuel: number;
  unite: string;
};

const PAY_MODES: { value: PayMode; label: string }[] = [
  { value: 'especes', label: 'Espèces' },
  { value: 'momo', label: 'Mobile Money' },
  { value: 'carte', label: 'Carte' },
  { value: 'credit', label: 'Crédit' },
];

interface PanierProps {
  items: CartItem[];
  onUpdate: (produitId: string, delta: number) => void;
  payMode: PayMode;
  onPayModeChange: (mode: PayMode) => void;
  onValider: () => void;
  loading: boolean;
  boutiqueName: string;
}

export default function Panier({
  items,
  onUpdate,
  payMode,
  onPayModeChange,
  onValider,
  loading,
  boutiqueName,
}: PanierProps) {
  const sousTotal = items.reduce((s, i) => s + i.prix_vente * i.qty, 0);
  const remise = sousTotal >= 50000 ? Math.round(sousTotal * 0.05) : 0;
  const total = sousTotal - remise;

  return (
    <aside className="flex flex-col bg-xa-surface border-l border-xa-border h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-xa-border">
        <h2 className="font-semibold text-xa-text text-sm">Panier</h2>
        <p className="text-xs text-xa-muted truncate">{boutiqueName}</p>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {items.length === 0 ? (
          <p className="text-center text-xa-muted text-xs mt-8">Panier vide</p>
        ) : (
          items.map((item) => (
            <div key={item.produit_id} className="bg-xa-bg rounded-lg p-2.5">
              <p className="text-xs font-semibold text-xa-text line-clamp-2 mb-1.5">
                {item.nom}
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdate(item.produit_id, -1)}
                    className="w-6 h-6 rounded-md border border-xa-border text-xa-text flex items-center justify-center text-sm hover:bg-xa-surface transition-colors"
                  >
                    −
                  </button>
                  <span className="text-sm font-bold text-xa-text w-6 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdate(item.produit_id, 1)}
                    disabled={item.qty >= item.stock_actuel}
                    className="w-6 h-6 rounded-md border border-xa-border text-xa-text flex items-center justify-center text-sm hover:bg-xa-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs font-semibold text-xa-primary">
                  {formatFCFA(item.prix_vente * item.qty)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals + payment modes + validate */}
      <div className="border-t border-xa-border px-3 py-3 space-y-3">
        {/* Totals */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-xa-muted">
            <span>Sous-total</span>
            <span>{formatFCFA(sousTotal)}</span>
          </div>
          {remise > 0 && (
            <div className="flex justify-between text-green-500">
              <span>Remise fidélité 5 %</span>
              <span>− {formatFCFA(remise)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xa-text text-sm pt-1">
            <span>Total</span>
            <span>{formatFCFA(total)}</span>
          </div>
        </div>

        {/* Payment modes */}
        <div className="grid grid-cols-2 gap-1.5">
          {PAY_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onPayModeChange(m.value)}
              className={`text-xs py-1.5 rounded-lg border transition-colors ${
                payMode === m.value
                  ? 'bg-xa-primary border-xa-primary text-white font-semibold'
                  : 'border-xa-border text-xa-muted hover:border-xa-primary hover:text-xa-text'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Validate button */}
        <button
          onClick={onValider}
          disabled={items.length === 0 || loading}
          className="w-full py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Validation…' : 'Valider la vente'}
        </button>
      </div>
    </aside>
  );
}
