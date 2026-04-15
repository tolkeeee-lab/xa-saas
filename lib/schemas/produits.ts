import { z } from 'zod';

export const produitsPostSchema = z.object({
  boutique_id: z.string().uuid(),
  nom: z.string().min(1),
  categorie: z.string().optional(),
  prix_achat: z.number().nonnegative(),
  prix_vente: z.number().positive(),
  stock_actuel: z.number().int().nonnegative().optional(),
  seuil_alerte: z.number().int().nonnegative().optional(),
  unite: z.string().optional(),
});

export const produitsPatchSchema = z.object({
  stock_actuel: z.number().int().nonnegative().optional(),
  prix_vente: z.number().positive().optional(),
});
