import { z } from 'zod';

const CATEGORIES = ['loyer', 'salaire', 'fournisseur', 'autre'] as const;
const PERIODICITES = ['mensuel', 'hebdo', 'annuel'] as const;

export const chargesFixesPostSchema = z.object({
  libelle: z.string().min(1),
  categorie: z.enum(CATEGORIES),
  boutique_id: z.string().uuid().nullable().optional(),
  montant: z.number().nonnegative(),
  periodicite: z.enum(PERIODICITES).optional(),
});

export const chargesFixesPatchSchema = z
  .object({
    libelle: z.string().min(1).optional(),
    categorie: z.enum(CATEGORIES).optional(),
    boutique_id: z.string().uuid().nullable().optional(),
    montant: z.number().nonnegative().optional(),
    periodicite: z.enum(PERIODICITES).optional(),
    actif: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Aucun champ à mettre à jour',
  });
