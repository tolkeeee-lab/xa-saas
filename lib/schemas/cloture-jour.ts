import { z } from 'zod';

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD attendu)');
const UUID = z.string().uuid();

export const clotureJourPostSchema = z.object({
  boutique_id: UUID,
  date: ISO_DATE,
  cash_compte: z.number().nonnegative(),
  note: z.string().max(500).optional(),
});

export const clotureValidateSchema = z.object({
  note: z.string().max(500).optional(),
});
