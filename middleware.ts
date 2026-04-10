import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const auth = request.cookies.get('xa_authenticated')?.value === 'true';
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard') && !auth) {
    return NextResponse.redirect(new URL('/auth/boutique', request.url));
  }
  if (pathname.startsWith('/auth') && auth) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/auth/:path*'] };
