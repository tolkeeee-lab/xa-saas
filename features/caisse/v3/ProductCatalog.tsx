'use client';

import { useMemo, useRef, type RefObject } from 'react';
import type { ProduitPublic } from '@/types/database';
import ProductCard from './ProductCard';
import { getCategoryEmoji } from './lib/categoryEmoji';

interface ProductCatalogProps {
  produits: ProduitPublic[];
  recherche: string;
  onRechercheChange: (v: string) => void;
  categorie: string;
  onCategorieChange: (c: string) => void;
  onAdd: (produit: ProduitPublic, emoji: string) => void;
  fetching?: boolean;
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

export default function ProductCatalog({
  produits,
  recherche,
  onRechercheChange,
  categorie,
  onCategorieChange,
  onAdd,
  fetching,
  searchInputRef,
}: ProductCatalogProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef ?? internalRef;

  // Derive unique categories
  const categories = useMemo(() => {
    const cats = produits
      .map((p) => (p.categorie?.trim() || 'Général') as string)
      .filter(Boolean);
    return ['Tout', ...Array.from(new Set(cats)).sort()];
  }, [produits]);

  // Filter products
  const produitsFiltres = useMemo(() => {
    const q = recherche.toLowerCase().trim();
    return produits.filter((p) => {
      const matchCat =
        categorie === 'Tout' ||
        (p.categorie?.trim() || 'Général') === categorie;
      const matchSearch = !q || p.nom.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [produits, categorie, recherche]);

  return (
    <div className="c-catalogue">
      {/* Search bar */}
      <div className="c-search-row">
        <label className="c-search-wrap" htmlFor="caisse-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" style={{ color: 'var(--c-faint)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            id="caisse-search"
            className="c-search-input"
            type="search"
            placeholder="Rechercher un produit… (Ctrl+K)"
            value={recherche}
            onChange={(e) => onRechercheChange(e.target.value)}
            aria-label="Rechercher un produit"
            autoComplete="off"
          />
        </label>

        {/* SCAN button (tooltip only — real camera scan not implemented) */}
        <button
          type="button"
          className="c-btn-scan"
          title="Utilisez une douchette ou tapez le code-barres"
          aria-label="Scanner un code-barres (utilisez une douchette USB)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4" />
            <line x1="8" y1="9" x2="8" y2="15" /><line x1="12" y1="9" x2="12" y2="15" /><line x1="16" y1="9" x2="16" y2="15" />
          </svg>
          SCAN
        </button>
      </div>

      {/* Category tabs */}
      <nav className="c-tabs" aria-label="Filtrer par catégorie" role="tablist">
        {categories.map((cat) => (
          <button
            key={cat}
            role="tab"
            type="button"
            aria-selected={categorie === cat}
            onClick={() => onCategorieChange(cat)}
            className={`c-tab${categorie === cat ? ' active' : ''}`}
          >
            {cat !== 'Tout' && (
              <span aria-hidden="true">{getCategoryEmoji(cat)} </span>
            )}
            {cat}
          </button>
        ))}
      </nav>

      {/* Product grid */}
      <div className="c-product-grid" aria-label="Catalogue produits" role="list">
        {fetching ? (
          <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '3px solid var(--c-accent)',
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : produitsFiltres.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 16px', color: 'var(--c-muted)' }}>
            {recherche ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                  Aucun produit pour &laquo;{recherche}&raquo;
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>Catalogue vide</p>
              </>
            )}
          </div>
        ) : (
          produitsFiltres.map((p) => (
            <div key={p.id} role="listitem">
              <ProductCard
                produit={p}
                onAdd={() => onAdd(p, getCategoryEmoji(p.categorie))}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
