import { z } from 'zod';

export const inventairePostSchema = z.object({
  boutique_id: z.string().uuid(),
  perimetre: z.enum(['complet', 'categorie', 'selection']),
  categorie: z.string().optional(),
  produit_ids: z.array(z.string().uuid()).optional(),
  note: z.string().optional(),
});

export const inventairePatchSchema = z.object({
  statut: z.enum(['annule']),
});

export const inventaireLignePatchSchema = z.object({
  stock_compte: z.number().nonnegative(),
});
