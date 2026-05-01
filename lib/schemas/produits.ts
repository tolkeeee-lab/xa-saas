import { z } from 'zod';

export const produitsPostSchema = z
  .object({
    boutique_id: z.string().uuid(),
    nom: z.string().min(1),
    categorie: z.string().optional(),
    prix_achat: z.number().nonnegative().optional(),
    prix_vente: z.number().positive(),
    stock_actuel: z.number().int().nonnegative().optional(),
    seuil_alerte: z.number().int().nonnegative().optional(),
    unite: z.string().optional(),
    // Conditionnement / lot fields
    mode_achat: z.enum(['unite', 'lot']).optional(),
    qty_par_lot: z.number().int().positive().optional().nullable(),
    prix_lot_achat: z.number().nonnegative().optional().nullable(),
    lot_label: z.string().optional().nullable(),
    unite_label: z.string().optional().nullable(),
    // Péremption
    date_peremption: z.string().date().optional().nullable(),
    // Image
    image_url: z.string().url().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.mode_achat === 'lot') {
        // For lot mode, qty_par_lot and prix_lot_achat are required; prix_achat is computed
        return (
          data.qty_par_lot != null &&
          data.qty_par_lot > 0 &&
          data.prix_lot_achat != null &&
          data.prix_lot_achat >= 0
        );
      }
      // For unite mode, prix_achat is required
      return data.prix_achat != null && data.prix_achat >= 0;
    },
    {
      message:
        'En mode lot: qty_par_lot et prix_lot_achat requis. En mode unité: prix_achat requis.',
      path: ['prix_achat'],
    },
  )
  .refine(
    (data) => {
      const prixAchatUnit =
        data.mode_achat === 'lot' && data.prix_lot_achat != null && data.qty_par_lot
          ? Math.round((data.prix_lot_achat / data.qty_par_lot) * 100) / 100
          : (data.prix_achat ?? 0);
      return data.prix_vente > prixAchatUnit;
    },
    {
      message: "Le prix de vente doit être supérieur au prix d'achat",
      path: ['prix_vente'],
    },
  );

export const produitsPatchSchema = z.object({
  stock_actuel: z.number().int().nonnegative().optional(),
  prix_vente: z.number().positive().optional(),
  date_peremption: z.string().date().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});
