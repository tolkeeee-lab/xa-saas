/**
 * POST /api/employe/session
 *   Body: { token: string }
 *   Sets the xa_employe_session HttpOnly cookie from the token obtained at
 *   /api/employe/verify-pin.  Validates the token before setting it.
 *   Response 200: { success: true }
 *   Response 400: { error: string }
 *
 * DELETE /api/employe/session
 *   Clears the xa_employe_session cookie (logout).
 *   Response 200: { success: true }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateEmployeSessionToken,
  EMPLOYE_COOKIE_NAME,
} from '@/lib/employe-session';

const SESSION_TTL_HOURS = 8;

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (
    !rawBody ||
    typeof rawBody !== 'object' ||
    typeof (rawBody as Record<string, unknown>).token !== 'string'
  ) {
    return NextResponse.json({ error: 'token requis' }, { status: 400 });
  }

  const { token } = rawBody as { token: string };

  // Validate the token before storing it
  const session = validateEmployeSessionToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 });
  }

  const maxAge = SESSION_TTL_HOURS * 60 * 60;
  const response = NextResponse.json({ success: true });
  response.cookies.set(EMPLOYE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(EMPLOYE_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
