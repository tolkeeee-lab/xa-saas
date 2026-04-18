/**
 * requireCaisseSession — reusable guard for caisse API route handlers.
 *
 * Usage in a route handler:
 *
 *   const guard = requireCaisseSession(request);
 *   if ('response' in guard) return guard.response;
 *   const { boutique_id } = guard.context;
 *
 * Optionally pass an expected boutique_id to verify the session was issued
 * for the correct boutique:
 *
 *   const guard = requireCaisseSession(request, body.boutique_id);
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateCaisseSession,
  CAISSE_SESSION_HEADER,
  type CaisseSessionError,
} from './caisseSession';

export type CaisseSessionContext = {
  boutique_id: string;
};

const ERROR_MESSAGES: Record<CaisseSessionError, string> = {
  MISSING: 'Session caisse manquante',
  MALFORMED: 'Session caisse invalide',
  EXPIRED: 'Session caisse expirée — veuillez vous reconnecter',
  INVALID_SIGNATURE: 'Session caisse invalide',
  WRONG_BOUTIQUE: 'Session caisse invalide pour cette boutique',
};

const ERROR_STATUS: Record<CaisseSessionError, number> = {
  MISSING: 401,
  MALFORMED: 401,
  EXPIRED: 401,
  INVALID_SIGNATURE: 401,
  WRONG_BOUTIQUE: 403,
};

/**
 * Validates the caisse session token from the `x-caisse-token` request header.
 *
 * Returns `{ context }` on success, or `{ response }` with an appropriate
 * 4xx NextResponse on failure — ready to be returned directly from the handler.
 */
export function requireCaisseSession(
  request: NextRequest,
  expectedBoutiqueId?: string,
): { context: CaisseSessionContext } | { response: NextResponse } {
  const token = request.headers.get(CAISSE_SESSION_HEADER);
  const validation = validateCaisseSession(token, expectedBoutiqueId);

  if (!validation.valid) {
    return {
      response: NextResponse.json(
        { error: ERROR_MESSAGES[validation.error] },
        { status: ERROR_STATUS[validation.error] },
      ),
    };
  }

  return { context: { boutique_id: validation.boutique_id } };
}
