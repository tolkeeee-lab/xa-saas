import { z } from 'zod';

export const clientsPostSchema = z.object({
  nom: z.string().min(1),
  telephone: z.string().optional(),
});

/**
 * Only name and telephone can be updated via the PATCH endpoint.
 * Points, total_achats and nb_visites are updated server-side by
 * /api/transactions (never accepted from the client to prevent abuse).
 */
export const clientsPatchSchema = z.object({
  nom: z.string().min(1).optional(),
  telephone: z.string().nullable().optional(),
});
