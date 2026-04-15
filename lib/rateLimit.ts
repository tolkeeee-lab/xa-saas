import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// NOTE: This in-memory store works for single-instance deployments.
// For multi-instance or serverless production environments, replace with a
// distributed cache such as Redis/Upstash.
const store = new Map<string, RateLimitEntry>();

/** Purge entries that have already passed their reset time to prevent unbounded growth. */
function pruneExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

/**
 * Returns { success: true } if the request is within the rate limit, otherwise
 * returns { success: false, response } with a 429 NextResponse ready to return.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): { success: true } | { success: false; response: NextResponse } {
  pruneExpired();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { success: true };
  }

  if (entry.count >= options.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        },
      ),
    };
  }

  entry.count++;
  return { success: true };
}

/**
 * Extracts the client IP from the request headers.
 *
 * The `x-forwarded-for` and `x-real-ip` headers are trusted here because
 * Next.js deployments (e.g. Vercel, AWS ALB) strip or overwrite these headers
 * at the infrastructure layer before they reach the application. If you deploy
 * behind a custom reverse proxy, ensure it overwrites these headers so clients
 * cannot spoof them.
 */
function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'anonymous'
  );
}

/**
 * Determines the rate limit options for a given method and route path.
 *
 * Rate limits:
 *  - /api/notifications  → 10/min (all methods)
 *  - /api/cloture-caisse → 10/min (all methods)
 *  - GET                 → 60/min
 *  - POST / PATCH / DELETE → 30/min
 */
function getOptions(method: string, pathname: string): RateLimitOptions {
  if (pathname.startsWith('/api/notifications') || pathname.startsWith('/api/cloture-caisse')) {
    return { windowMs: 60_000, max: 10 };
  }
  if (method === 'GET') {
    return { windowMs: 60_000, max: 60 };
  }
  return { windowMs: 60_000, max: 30 };
}

/**
 * Convenience wrapper: builds the rate-limit key from IP + method + pathname and
 * returns a 429 response when the limit is exceeded, or null when the request is allowed.
 *
 * Usage:
 *   const limited = applyRateLimit(request);
 *   if (limited) return limited;
 */
export function applyRateLimit(request: NextRequest): NextResponse | null {
  const ip = getIp(request);
  const pathname = new URL(request.url).pathname;
  const method = request.method.toUpperCase();
  const key = `${ip}:${method}:${pathname}`;
  const options = getOptions(method, pathname);
  const result = checkRateLimit(key, options);
  if (!result.success) return result.response;
  return null;
}
