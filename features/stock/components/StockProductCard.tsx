'use client';

import { PackagePlus, PackageMinus, ArrowLeftRight, History } from 'lucide-react';
import type { Produit } from '@/types/database';

type Props = {
  produit: Produit;
  onReception: () => void;
  onSortie: () => void;
  onTransfert: () => void;
  onHistorique: () => void;
  onClick: () => void;
};

function getStockPillClass(stock: number, seuil: number) {
  if (stock <= 0) return 'xa-stock-pill-rupture';
  if (stock <= seuil) return 'xa-stock-pill-warn';
  return 'xa-stock-pill-ok';
}

function getStockLabel(stock: number, seuil: number) {
  if (stock <= 0) return 'Rupture';
  if (stock <= seuil) return `${stock}`;
  return `${stock}`;
}

export default function StockProductCard({
  produit,
  onReception,
  onSortie,
  onTransfert,
  onHistorique,
  onClick,
}: Props) {
  const pillClass = getStockPillClass(produit.stock_actuel, produit.seuil_alerte);

  return (
    <div
      className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden"
      style={{ animation: 'xa-fade-up .25s ease both' }}
    >
      {/* Card header — clickable for edit */}
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-xa-bg2 transition-colors"
      >
        <span className="text-[32px] leading-none flex-shrink-0 mt-0.5" aria-hidden="true">
          {produit.categorie === 'Boissons'
            ? '🥤'
            : produit.categorie === 'Épicerie'
            ? '🛒'
            : produit.categorie === 'Hygiène'
            ? '🧴'
            : produit.categorie === 'Frais'
            ? '🥩'
            : produit.categorie === 'Boulangerie'
            ? '🍞'
            : '📦'}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-xa-text leading-tight">{produit.nom}</p>
            <span className={pillClass} style={{ flexShrink: 0 }}>
              {getStockLabel(produit.stock_actuel, produit.seuil_alerte)}
            </span>
          </div>
          <p className="text-xs text-xa-muted mt-0.5">
            {produit.unite}
            {produit.categorie ? ` · ${produit.categorie}` : ''}
          </p>
          <p className="text-xs font-semibold text-xa-text mt-1">
            {produit.prix_vente.toLocaleString('fr-FR')} F
          </p>
        </div>
      </button>

      {/* Action buttons */}
      <div className="flex items-center gap-0 border-t border-xa-border divide-x divide-xa-border">
        <ActionBtn
          icon={<PackagePlus size={16} />}
          label="Réceptionner"
          onClick={onReception}
          color="var(--xa-green)"
        />
        <ActionBtn
          icon={<PackageMinus size={16} />}
          label="Sortie"
          onClick={onSortie}
          color="var(--xa-danger)"
        />
        <ActionBtn
          icon={<ArrowLeftRight size={16} />}
          label="Transférer"
          onClick={onTransfert}
          color="var(--xa-amber)"
        />
        <ActionBtn
          icon={<History size={16} />}
          label="Historique"
          onClick={onHistorique}
          color="var(--xa-blue)"
        />
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={label}
      aria-label={label}
      className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 hover:bg-xa-bg2 transition-colors"
      style={{ minHeight: 52, color }}
    >
      {icon}
      <span className="text-[10px] font-medium text-xa-muted leading-none">{label}</span>
    </button>
  );
}
