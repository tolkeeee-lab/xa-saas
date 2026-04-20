import { z } from 'zod';

export const categoriesPostSchema = z.object({
  nom: z.string().min(1).max(50),
  icone: z.string().optional(),
  couleur: z.string().optional(),
});

export const categoriesPatchSchema = z.object({
  nom: z.string().min(1).max(50).optional(),
  icone: z.string().optional(),
  couleur: z.string().optional(),
  ordre: z.number().int().optional(),
});
