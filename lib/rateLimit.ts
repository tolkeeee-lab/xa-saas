import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// NOTE: This in-memory store works for single-instance deployments.
// For multi-instance or serverless production environments, set
// USE_DISTRIBUTED_RATE_LIMIT=true and configure UPSTASH_REDIS_REST_URL /
// UPSTASH_REDIS_REST_TOKEN to switch to the distributed implementation.
const store = new Map<string, RateLimitEntry>();

// ─── PIN brute-force store ────────────────────────────────────────────────────

/** Maximum PIN attempts before a 15-minute lockout. */
const PIN_MAX_ATTEMPTS = 5;
/** Lockout window for failed PIN attempts (milliseconds). */
export const PIN_WINDOW_MS = 15 * 60 * 1_000;

const pinStore = new Map<string, RateLimitEntry>();

function pruneExpiredPin(): void {
  const now = Date.now();
  for (const [key, entry] of pinStore) {
    if (now > entry.resetAt) pinStore.delete(key);
  }
}

/**
 * Records a failed PIN attempt for the given key and returns whether the
 * caller should be blocked (true = blocked / too many failures).
 *
 * Key format recommended: `pin:${ip}:${boutique_id}`
 */
export function recordPinFailure(key: string): boolean {
  pruneExpiredPin();
  const now = Date.now();
  const entry = pinStore.get(key);

  if (!entry || now > entry.resetAt) {
    pinStore.set(key, { count: 1, resetAt: now + PIN_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > PIN_MAX_ATTEMPTS;
}

/**
 * Returns true if the key is currently locked out due to too many PIN failures.
 */
export function isPinLocked(key: string): { locked: boolean; retryAfterSec: number } {
  pruneExpiredPin();
  const now = Date.now();
  const entry = pinStore.get(key);
  if (!entry || now > entry.resetAt) return { locked: false, retryAfterSec: 0 };
  if (entry.count >= PIN_MAX_ATTEMPTS) {
    return { locked: true, retryAfterSec: Math.ceil((entry.resetAt - now) / 1_000) };
  }
  return { locked: false, retryAfterSec: 0 };
}

/**
 * Clears the brute-force counter for a key after a successful PIN verification.
 */
export function clearPinFailures(key: string): void {
  pinStore.delete(key);
}

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

/** In-memory rate limit (synchronous, used when distributed mode is off). */
function applyRateLimitInMemory(request: NextRequest): NextResponse | null {
  const ip = getIp(request);
  const pathname = new URL(request.url).pathname;
  const method = request.method.toUpperCase();
  const key = `${ip}:${method}:${pathname}`;
  const options = getOptions(method, pathname);
  const result = checkRateLimit(key, options);
  if (!result.success) return result.response;
  return null;
}

/**
 * Applies rate limiting to an incoming request.
 *
 * When USE_DISTRIBUTED_RATE_LIMIT=true and Upstash credentials are present the
 * check is delegated to the distributed Upstash backend (sliding window, works
 * across serverless instances).  Otherwise falls back to the in-memory store
 * which is suitable for single-instance / development deployments.
 *
 * Usage (all API route handlers are async, so await is free):
 *   const limited = await applyRateLimit(request);
 *   if (limited) return limited;
 */
export async function applyRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (
    process.env.USE_DISTRIBUTED_RATE_LIMIT === 'true' &&
    process.env.UPSTASH_REDIS_REST_URL
  ) {
    const { applyRateLimitDistributed } = await import('./rateLimitDistributed');
    return applyRateLimitDistributed(request);
  }
  return applyRateLimitInMemory(request);
}
