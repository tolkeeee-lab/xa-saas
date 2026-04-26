import { z } from 'zod';

const COMMENT_CONNU_OPTIONS = [
  'WhatsApp / Bouche à oreille',
  'Facebook / Instagram',
  'Un autre boutiquier',
  'Démarchage MAFRO',
  'Autre',
] as const;

/** Normalises a Beninese phone number: if 8 digits → prefixes +229 */
function normalisePhone(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{8}$/.test(trimmed)) return `+229${trimmed}`;
  return trimmed;
}

export const inscriptionSchema = z
  .object({
    nom_complet: z.string().trim().min(2).max(80),
    email: z.string().trim().email().transform((v) => v.toLowerCase()),
    telephone_whatsapp: z
      .string()
      .trim()
      .min(8)
      .max(20)
      .transform(normalisePhone),
    boutique_nom: z.string().trim().min(2).max(60),
    boutique_zone: z.string().trim().min(2).max(60),
    password: z.string().min(8),
    password_confirm: z.string().min(8),
    comment_connu: z
      .enum(COMMENT_CONNU_OPTIONS)
      .nullable()
      .optional(),
    cgu_accepted: z.literal(true).refine((v) => v === true, {
      message: 'Vous devez accepter les conditions.',
    }),
    // honeypot — must be empty string or absent
    website: z.string().max(0).optional(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['password_confirm'],
  });

export type InscriptionPayload = z.infer<typeof inscriptionSchema>;

export const COMMENT_CONNU_VALUES = COMMENT_CONNU_OPTIONS;
