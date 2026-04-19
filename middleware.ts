import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { validateEmployeSessionToken, EMPLOYE_COOKIE_NAME } from '@/lib/employe-session';

const PUBLIC_ROUTES = ['/login', '/register', '/offline'];
const CAISSE_PREFIX = '/api/caisse';
/** Employee API routes — accessible with employee session only (no Supabase Auth). */
const EMPLOYE_API_PREFIX = '/api/employe';

/** Routes in the (employe) group that DON'T require an employee session. */
const EMPLOYE_PUBLIC_PATHS = ['/caisse/lock'];

function isEmployePublicPath(pathname: string): boolean {
  return EMPLOYE_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/** Routes in the (employe) group that DO require an employee session. */
const EMPLOYE_PROTECTED_PREFIXES = ['/caisse', '/stock', '/ventes', '/dettes', '/clients', '/cloture', '/inventaire'];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith(CAISSE_PREFIX)) return true;
  if (isEmployePublicPath(pathname)) return true;
  return false;
}

function isEmployeRoute(pathname: string): boolean {
  return EMPLOYE_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Employee API routes ──────────────────────────────────────────────────────
  // These require a valid employee session cookie (not Supabase Auth)
  if (pathname.startsWith(EMPLOYE_API_PREFIX)) {
    // verify-pin, boutique-info, and session itself are public
    const publicEmployeApiPaths = [
      `${EMPLOYE_API_PREFIX}/verify-pin`,
      `${EMPLOYE_API_PREFIX}/session`,
      `${EMPLOYE_API_PREFIX}/boutique-info`,
    ];
    if (!publicEmployeApiPaths.some((p) => pathname.startsWith(p))) {
      const token = request.cookies.get(EMPLOYE_COOKIE_NAME)?.value ?? null;
      const empSession = validateEmployeSessionToken(token);
      if (!empSession) {
        return NextResponse.json({ error: 'Session employé requise' }, { status: 401 });
      }
    }
    return NextResponse.next({ request });
  }

  // ── Employee protected page routes ───────────────────────────────────────────
  if (isEmployeRoute(pathname)) {
    // If it's the lock screen, always allow
    if (isEmployePublicPath(pathname)) {
      return NextResponse.next({ request });
    }

    // Require employee session
    const token = request.cookies.get(EMPLOYE_COOKIE_NAME)?.value ?? null;
    const empSession = validateEmployeSessionToken(token);
    if (!empSession) {
      return NextResponse.redirect(new URL('/caisse/lock', request.url));
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Block employee access to dashboard routes ────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get(EMPLOYE_COOKIE_NAME)?.value ?? null;
    const empSession = validateEmployeSessionToken(token);
    if (empSession && !user) {
      // Employee cookie present without Supabase Auth → block dashboard access
      return NextResponse.redirect(new URL('/caisse', request.url));
    }
    // If both employee cookie and Supabase user → proprio wins; clear employee cookie
    if (empSession && user) {
      const resp = NextResponse.next({ request });
      resp.cookies.set(EMPLOYE_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return resp;
    }
  }

  // Protect /admin — only SUPER_ADMIN_EMAIL can access
  if (pathname.startsWith('/admin')) {
    if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // Redirect authenticated users away from /login and /register
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Public routes are accessible without authentication
  if (isPublicRoute(pathname)) {
    return response;
  }

  // All other routes require authentication
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-.*\\.js).*)',
  ],
};
