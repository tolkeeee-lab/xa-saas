import { z } from 'zod';

const ligneSchema = z.object({
  produit_id: z.string().uuid(),
  quantite: z.number().int().positive(),
  prix_unitaire: z.number().nonnegative(),
});

export const transactionsPostSchema = z.object({
  boutique_id: z.string().uuid(),
  lignes: z.array(ligneSchema).min(1),
  mode_paiement: z.enum(['especes', 'momo', 'carte', 'credit']),
  montant_total: z.number().nonnegative(),
  client_nom: z.string().optional(),
  client_telephone: z.string().optional(),
});
