import { z } from 'zod';

const ligneSchema = z.object({
  produit_id: z.string().uuid(),
  quantite: z.number().int().positive(),
  prix_unitaire: z.number().nonnegative(),
});

export const venteV3Schema = z.object({
  boutique_id: z.string().uuid(),
  lignes: z.array(ligneSchema).min(1),
  mode_paiement: z.enum(['especes', 'momo', 'carte', 'credit']),
  montant_total: z.number().nonnegative(),
  /** Custom discount percentage (0–100) */
  remise_pct: z.number().min(0).max(100).default(0),
  montant_recu: z.number().nonnegative().optional(),
  monnaie_rendue: z.number().nonnegative().optional(),
  client_nom: z.string().optional(),
  client_telephone: z.string().optional(),
  /** Idempotency key — generated client-side */
  local_id: z.string().uuid().optional(),
  /** Loyalty client — for point tracking */
  client_id: z.string().uuid().optional(),
  /** Name of the cashier performing the sale */
  caissier_nom: z.string().max(120).optional(),
  /** Employee UUID — for DB traceability (transactions.employe_id) */
  employe_id: z.string().uuid().optional(),
});

export type VenteV3Body = z.infer<typeof venteV3Schema>;
