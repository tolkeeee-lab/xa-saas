'use client';

import AddProduitModal from '@/features/stocks/AddProduitModal';
import type { Boutique, ProduitPublic, CategorieProduit } from '@/types/database';

type Props = {
  boutiques: Boutique[];
  defaultBoutiqueId?: string;
  categories?: CategorieProduit[];
  onClose: () => void;
  onSuccess: (produit: ProduitPublic) => void;
  onCategoryCreated?: (cat: CategorieProduit) => void;
};

export default function NouveauProduitModal({
  boutiques,
  defaultBoutiqueId,
  categories,
  onClose,
  onSuccess,
  onCategoryCreated,
}: Props) {
  return (
    <AddProduitModal
      boutiques={boutiques}
      defaultBoutiqueId={defaultBoutiqueId}
      categories={categories}
      onClose={onClose}
      onSuccess={onSuccess}
      onCategoryCreated={onCategoryCreated}
    />
  );
}
