/**
 * Shared pricing helpers used by both server-side API routes and client-side
 * components to ensure that discount and total calculations are always identical
 * on both sides of the wire.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Basket amount (FCFA) above which the 5 % basket discount applies. */
export const REMISE_PANIER_SEUIL = 50_000;

/** Discount rate applied to both basket and loyalty discounts. */
export const REMISE_TAUX = 0.05;

/**
 * Minimum number of loyalty points required for the client discount to apply.
 * When a client reaches this threshold the 5 % client discount is granted
 * (provided the basket discount is not already active), and their points are
 * reset to 0 after the sale.
 */
export const POINTS_REMISE_SEUIL = 100;

/** Amount of FCFA spent per loyalty point earned (1 point per 1 000 FCFA). */
export const POINTS_PAR_FCFA = 1_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type LignePrix = {
  prix_unitaire: number;
  quantite: number;
};

export type PrixResult = {
  sousTotal: number;
  remise: number;
  montantTotal: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise a charge amount to its monthly equivalent.
 * Used for consistent charge calculations across the codebase.
 */
export function toMensuel(
  montant: number,
  periodicite: 'mensuel' | 'hebdo' | 'annuel',
): number {
  if (periodicite === 'hebdo') return montant * (52 / 12);
  if (periodicite === 'annuel') return montant / 12;
  return montant;
}

/**
 * Calculates the basket subtotal, applicable discount, and final total.
 *
 * Discount rules (FCFA, integers only):
 *  1. Basket discount: 5 % when subtotal ≥ 50 000 FCFA.
 *  2. Loyalty discount: 5 % when a client with ≥ 100 points is attached AND
 *     the basket discount is not already active (they are mutually exclusive).
 *
 * All fractional amounts are rounded with Math.round to keep values as integers.
 */
export function calculatePrix(
  lignes: LignePrix[],
  hasClientRemise = false,
): PrixResult {
  const sousTotal = lignes.reduce(
    (s, l) => s + l.prix_unitaire * l.quantite,
    0,
  );

  const remisePanier =
    sousTotal >= REMISE_PANIER_SEUIL ? Math.round(sousTotal * REMISE_TAUX) : 0;

  const remiseClient =
    hasClientRemise && remisePanier === 0
      ? Math.round(sousTotal * REMISE_TAUX)
      : 0;

  const remise = remisePanier + remiseClient;

  return { sousTotal, remise, montantTotal: sousTotal - remise };
}

/**
 * Returns the number of loyalty points earned for a given transaction total.
 * 1 point is awarded per 1 000 FCFA spent (rounded down).
 */
export function calculatePointsGagnes(montantTotal: number): number {
  return Math.floor(montantTotal / POINTS_PAR_FCFA);
}
