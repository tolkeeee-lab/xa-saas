import { z } from 'zod';

export const transfertsPostSchema = z
  .object({
    produit_id: z.string().uuid(),
    boutique_source_id: z.string().uuid(),
    boutique_destination_id: z.string().uuid(),
    quantite: z.number().int().positive(),
    note: z.string().nullable().optional(),
  })
  .refine((data) => data.boutique_source_id !== data.boutique_destination_id, {
    message: 'La source et la destination doivent être différentes',
    path: ['boutique_destination_id'],
  });

export const transfertsPatchSchema = z.object({
  statut: z.enum(['en_transit', 'livre']),
});
