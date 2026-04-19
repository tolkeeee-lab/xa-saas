/**
 * Maps FilterBar chip IDs to their corresponding `type` values in the
 * `activity_events` table so that client-side and server-side filters
 * speak the same language.
 */
export const TYPE_CHIP_TO_DB: Record<string, string | null> = {
  all: null,
  ventes: 'sale',
  alertes: 'alert',
  stocks: 'stock',
  personnel: 'staff',
  objectifs: 'goal',
};

/**
 * Returns the DB `type` value that corresponds to the given chip ID,
 * or `null` when no filter should be applied (chip = "all" or unknown).
 */
export function dbTypeFromChip(chip: string | null | undefined): string | null {
  if (!chip || chip === 'all') return null;
  return TYPE_CHIP_TO_DB[chip] ?? null;
}
