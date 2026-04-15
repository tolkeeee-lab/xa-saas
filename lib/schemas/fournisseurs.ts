import { z } from 'zod';

export const fournisseursPostSchema = z.object({
  nom: z.string().min(1),
  specialite: z.string().nullable().optional(),
  delai_livraison: z.string().nullable().optional(),
  note: z.number().nonnegative().optional(),
  telephone: z.string().nullable().optional(),
});

export const commandeFournisseurSchema = z.object({
  fournisseur_id: z.string().uuid(),
  boutique_id: z.string().uuid(),
  montant: z.number().positive(),
  note: z.string().nullable().optional(),
});
