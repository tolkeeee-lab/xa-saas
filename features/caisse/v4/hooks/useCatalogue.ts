'use client';

import { useMemo } from 'react';
import type { ProduitPublic } from '@/types/database';

export function useCatalogue(
  produits: ProduitPublic[],
  recherche: string,
  categorie: string,
) {
  const categories = useMemo(() => {
    const unique = Array.from(new Set(produits.map((p) => p.categorie).filter(Boolean)));
    return ['Tout', ...unique];
  }, [produits]);

  const produitsFiltres = useMemo(() => {
    let result = produits;
    if (categorie !== 'Tout') {
      result = result.filter((p) => p.categorie === categorie);
    }
    if (recherche.trim()) {
      const q = recherche.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          p.categorie?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [produits, recherche, categorie]);

  return { produitsFiltres, categories };
}
