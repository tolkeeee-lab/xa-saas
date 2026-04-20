/**
 * DELETE /api/employe/session
 *
 * Logs out the current employee by clearing the session cookie.
 *
 * Response 200: { success: true }
 */
import { NextResponse } from 'next/server';
import { clearEmployeCookie } from '@/lib/employe-session-server';

export async function DELETE() {
  await clearEmployeCookie();
  return NextResponse.json({ success: true });
}
