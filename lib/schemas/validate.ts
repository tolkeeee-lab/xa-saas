import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Validates an unknown value against a Zod schema.
 *
 * Returns `{ data, error: null }` on success or `{ data: null, error }` with a
 * 400 NextResponse on failure. The caller should return the `error` response
 * immediately when it is not null.
 *
 * Uses `z.ZodTypeAny` + `z.output<S>` so that schemas with chained `.refine()`
 * (which wrap in ZodEffects) are correctly inferred.
 */
export function validateBody<S extends z.ZodTypeAny>(
  schema: S,
  body: unknown,
): { data: z.output<S>; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 },
      ),
    };
  }
  return { data: result.data as z.output<S>, error: null };
}
