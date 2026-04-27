/** Returns a representative emoji for a product category name */
export function getCategoryEmoji(cat: string | null | undefined): string {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('boisson') || c.includes('drink')) return '🥤';
  if (c.includes('alimentaire') || c.includes('aliment') || c.includes('food')) return '🍎';
  if (c.includes('hygien') || c.includes('nettoy')) return '🧼';
  if (c.includes('viande') || c.includes('poisson')) return '🥩';
  if (c.includes('légume') || c.includes('legume') || c.includes('fruit')) return '🥦';
  if (c.includes('lait') || c.includes('dairy')) return '🥛';
  if (c.includes('pain') || c.includes('boulangerie')) return '🍞';
  if (c.includes('huile') || c.includes('oil')) return '🫒';
  if (c.includes('divers') || c.includes('autre')) return '🧴';
  if (c.includes('mafro')) return '🥢'; // catégorie produits africains MAFRO
  return '📦';
}
