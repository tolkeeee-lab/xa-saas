import { z } from 'zod';

export const validateRetraitCodeSchema = z.object({
  code: z.string().min(1).max(10),
  boutique_id: z.string().uuid(),
});

export const markRetiredSchema = z.object({
  employe_id: z.string().uuid(),
});
