import { z } from 'zod';

export const submitB2BOrderSchema = z.object({
  boutique_id: z.string().uuid(),
  lignes: z
    .array(
      z.object({
        produit_admin_id: z.string().uuid(),
        produit_nom: z.string().min(1),
        produit_emoji: z.string().optional(),
        unite: z.string().optional().nullable(),
        quantite: z.number().int().positive(),
        prix_unitaire: z.number().positive(),
        total_ligne: z.number().positive(),
      }),
    )
    .min(1),
  mode_paiement: z
    .enum(['a_la_livraison', 'momo', 'virement'])
    .default('a_la_livraison'),
  note: z.string().optional().nullable(),
});
