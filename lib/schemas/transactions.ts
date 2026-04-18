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
  /** Idempotency key — generated client-side with crypto.randomUUID() */
  local_id: z.string().uuid().optional(),
  /** Loyalty client — if provided, points are updated server-side */
  client_id: z.string().uuid().optional(),
  client_nom: z.string().optional(),
  client_telephone: z.string().optional(),
});
