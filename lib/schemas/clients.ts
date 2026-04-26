import { z } from 'zod';

/** Phone number: must start with optional +, contain 7-20 allowed chars, and include at least 7 digits */
export const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;
/** Validates that a phone string contains at least 7 digit characters */
export function isValidPhoneDigits(tel: string): boolean {
  return (tel.match(/\d/g)?.length ?? 0) >= 7;
}

export const clientsPostSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100),
  prenom: z.string().max(100).nullable().optional(),
  telephone: z
    .string()
    .regex(PHONE_REGEX, 'Format téléphone invalide')
    .refine((tel) => isValidPhoneDigits(tel), 'Le numéro doit contenir au moins 7 chiffres')
    .nullable()
    .optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  opt_in_whatsapp: z.boolean().optional().default(false),
  note: z.string().max(500).nullable().optional(),
});

export type ClientsPostInput = z.infer<typeof clientsPostSchema>;

/**
 * Only safe client-editable fields. Points, total_achats, nb_visites, credit_actuel
 * are updated server-side only (never accepted directly from the client for mutations
 * that could be abused — credit changes go through dedicated endpoints).
 */
export const clientsPatchSchema = z.object({
  nom: z.string().min(1).max(100).optional(),
  prenom: z.string().max(100).nullable().optional(),
  telephone: z
    .string()
    .regex(PHONE_REGEX, 'Format téléphone invalide')
    .refine((tel) => isValidPhoneDigits(tel), 'Le numéro doit contenir au moins 7 chiffres')
    .nullable()
    .optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  opt_in_whatsapp: z.boolean().optional(),
  note: z.string().max(500).nullable().optional(),
});

export type ClientsPatchInput = z.infer<typeof clientsPatchSchema>;

