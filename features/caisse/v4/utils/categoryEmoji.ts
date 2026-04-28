/**
 * Category emoji fallback mapping for the xà Caisse v3.
 * Used when a product has no dedicated `emoji` field in the DB.
 */
export const CATEGORY_EMOJI: Record<string, string> = {
  aliment: '🌾',
  alimentaire: '🌾',
  alimentation: '🌾',
  hygiene: '🧼',
  hygiène: '🧼',
  boisson: '🥤',
  boissons: '🥤',
  bebe: '👶',
  bébé: '👶',
  menage: '🏠',
  ménage: '🏠',
  cosmetique: '💄',
  cosmétique: '💄',
  sante: '💊',
  santé: '💊',
  electronique: '📱',
  électronique: '📱',
  vetement: '👕',
  vêtement: '👕',
  general: '📦',
  général: '📦',
};

/** Returns an emoji for a product category, with a fallback to 📦 */
export function getCategoryEmoji(categorie?: string | null): string {
  if (!categorie) return '📦';
  const key = categorie.toLowerCase().trim();
  return CATEGORY_EMOJI[key] ?? '📦';
}
