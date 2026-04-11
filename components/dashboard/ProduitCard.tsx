import { formatFCFA } from '@/lib/format';
import type { ProduitPublic } from '@/types/database';

interface ProduitCardProps {
  produit: ProduitPublic;
  onAdd: () => void;
}

export default function ProduitCard({ produit, onAdd }: ProduitCardProps) {
  const rupture = produit.stock_actuel === 0;

  return (
    <button
      onClick={rupture ? undefined : onAdd}
      disabled={rupture}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        rupture
          ? 'opacity-50 cursor-not-allowed bg-xa-surface border-xa-border'
          : 'bg-xa-surface border-xa-border hover:border-xa-primary cursor-pointer active:scale-95'
      }`}
    >
      <p className="text-sm font-semibold text-xa-text leading-tight line-clamp-2">
        {produit.nom}
      </p>
      <p className="mt-1.5 text-base font-bold text-xa-primary">
        {formatFCFA(produit.prix_vente)}
      </p>
      <p className={`mt-1 text-xs ${rupture ? 'text-xa-danger' : 'text-xa-muted'}`}>
        {rupture ? 'Rupture' : `Stock : ${produit.stock_actuel} ${produit.unite}`}
      </p>
    </button>
  );
}
