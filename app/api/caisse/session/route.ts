/**
 * DELETE /api/caisse/session
 *
 * Invalidates a caisse session token (logout / lock POS terminal).
 *
 * Adds the token to the in-memory denylist so it cannot be reused for the
 * remainder of its TTL.  The POS client should discard the token locally
 * after calling this endpoint.
 *
 * Note: the denylist is process-local.  In multi-instance deployments tokens
 * will still be accepted by other instances until they naturally expire (8 h).
 * If precise cross-instance revocation is required, a Redis-backed denylist
 * can be added in a future iteration.
 *
 * Request header: x-caisse-token: <token>
 *
 * Response 200: { success: true }
 * Response 401: { error: string }  ← if the header is missing
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateCaisseSession,
  invalidateCaisseSession,
  CAISSE_SESSION_HEADER,
} from '@/lib/caisseSession';

export async function DELETE(request: NextRequest) {
  const token = request.headers.get(CAISSE_SESSION_HEADER);

  if (!token) {
    return NextResponse.json({ error: 'Session caisse manquante' }, { status: 401 });
  }

  // Validate before revoking so we can log the boutique_id.
  // Even if the token is already expired or invalid we return success (idempotent).
  const validation = validateCaisseSession(token);

  if (validation.valid) {
    invalidateCaisseSession(token);
    console.info('[caisse-session] session_invalidee', {
      boutique_id: validation.boutique_id,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ success: true });
}
