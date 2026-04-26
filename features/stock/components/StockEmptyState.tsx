'use client';

import { PackageSearch, Plus } from 'lucide-react';

type Props = {
  tab: string;
  onAddProduct: () => void;
};

const MESSAGES: Record<string, string> = {
  tous: 'Aucun produit dans cette boutique.',
  bas: 'Aucun produit en stock bas.',
  rupture: 'Aucun produit en rupture.',
  perime: 'Aucun produit périmé.',
};

export default function StockEmptyState({ tab, onAddProduct }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <PackageSearch size={40} className="text-xa-muted mb-3" strokeWidth={1.5} />
      <p className="text-sm font-medium text-xa-text mb-1">
        {MESSAGES[tab] ?? 'Aucun résultat.'}
      </p>
      {tab === 'tous' && (
        <button
          type="button"
          onClick={onAddProduct}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--xa-primary)', minHeight: 40 }}
        >
          <Plus size={16} />
          Ajouter un produit
        </button>
      )}
    </div>
  );
}
