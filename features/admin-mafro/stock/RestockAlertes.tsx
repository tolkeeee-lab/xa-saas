import type { ProduitCatalogueAdmin } from '@/types/database';
import { AlertTriangle } from 'lucide-react';

type Props = {
  produits: ProduitCatalogueAdmin[];
};

export default function RestockAlertes({ produits }: Props) {
  if (produits.length === 0) return null;

  return (
    <div className="xa-restock-alertes">
      <div className="xa-restock-alertes__header">
        <AlertTriangle size={16} />
        <strong>{produits.length} rupture(s) détectée(s)</strong>
      </div>
      <ul className="xa-restock-alertes__list">
        {produits.slice(0, 8).map((p) => (
          <li key={p.id} className="xa-restock-alertes__item">
            {p.emoji} {p.nom}
          </li>
        ))}
        {produits.length > 8 && (
          <li className="xa-restock-alertes__item xa-restock-alertes__item--more">
            +{produits.length - 8} autres…
          </li>
        )}
      </ul>
    </div>
  );
}
