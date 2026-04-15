import { z } from 'zod';

export const dettesProprioPostSchema = z.object({
  libelle: z.string().min(1),
  creancier: z.string().min(1),
  montant: z.number().nonnegative(),
  montant_rembourse: z.number().nonnegative().optional(),
  date_echeance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  notes: z.string().nullable().optional(),
});

export const dettesProprioPathSchema = z.object({
  statut: z.enum(['en_cours', 'rembourse', 'en_retard']).optional(),
  montant_rembourse: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional(),
});
