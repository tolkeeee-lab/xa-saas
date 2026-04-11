import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? '';
const PUBLIC_PATHS = ['/login', '/register', '/caisse', '/offline', '/api/caisse'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (pathname.startsWith('/admin')) {
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }
  if (!user && !isPublic) return NextResponse.redirect(new URL('/login', request.url));
  if (user && (pathname === '/login' || pathname === '/register')) return NextResponse.redirect(new URL('/dashboard', request.url));
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:png|jpg|svg|ico|json|js)$).*)'],
};
