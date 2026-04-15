import { z } from 'zod';

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD attendu)');

export const clotureCaissePostSchema = z.object({
  boutique_id: z.string().uuid(),
  date: ISO_DATE,
  cash_reel: z.number().nonnegative(),
  note: z.string().optional(),
});
