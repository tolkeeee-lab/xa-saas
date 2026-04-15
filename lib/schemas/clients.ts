import { z } from 'zod';

export const clientsPostSchema = z.object({
  nom: z.string().min(1),
  telephone: z.string().optional(),
});

export const clientsPatchSchema = z.object({
  nom: z.string().min(1).optional(),
  telephone: z.string().nullable().optional(),
  points_delta: z.number().optional(),
  total_achats_delta: z.number().optional(),
  increment_visites: z.boolean().optional(),
});
