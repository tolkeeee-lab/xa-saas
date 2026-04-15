import { z } from 'zod';

export const dettesPostSchema = z.object({
  boutique_id: z.string().uuid(),
  client_nom: z.string().min(1),
  client_telephone: z.string().optional(),
  montant: z.number().positive(),
  description: z.string().optional(),
  date_echeance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const dettesPatchSchema = z.object({
  statut: z.enum(['en_attente', 'paye', 'en_retard']).optional(),
  montant_rembourse: z.number().nonnegative().optional(),
});
