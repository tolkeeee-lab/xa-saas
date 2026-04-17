/**
 * Distributed rate-limiting backed by Upstash Redis.
 *
 * This module is only loaded when USE_DISTRIBUTED_RATE_LIMIT=true and
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set.
 * It exposes the same `applyRateLimitDistributed` contract as the
 * in-memory fallback so callers can swap implementations transparently.
 *
 * Uses a sliding-window algorithm (Upstash Ratelimit) to prevent request
 * bursts at window boundaries that a fixed-window counter would allow.
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { NextRequest, NextResponse } from 'next/server';

// ─── Singleton initialisation ────────────────────────────────────────────────

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// Pre-build one limiter per (max, window) pair to avoid recreating instances.
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(max: number): Ratelimit {
  const cacheKey = String(max);
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(max, '60 s'),
      analytics: false,
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

// ─── Helpers (mirrored from lib/rateLimit.ts) ────────────────────────────────

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'anonymous'
  );
}

function getMax(method: string, pathname: string): number {
  if (
    pathname.startsWith('/api/notifications') ||
    pathname.startsWith('/api/cloture-caisse')
  ) {
    return 10;
  }
  if (method === 'GET') return 60;
  return 30;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Distributed rate-limit check.  Returns a 429 NextResponse when the
 * limit is exceeded, or null when the request is allowed.
 *
 * Falls back gracefully to allowing the request if Redis is unreachable,
 * so a Redis outage never blocks legitimate traffic.
 */
export async function applyRateLimitDistributed(
  request: NextRequest,
): Promise<NextResponse | null> {
  try {
    const ip = getIp(request);
    const pathname = new URL(request.url).pathname;
    const method = request.method.toUpperCase();
    const max = getMax(method, pathname);
    const key = `rl:${ip}:${method}:${pathname}`;

    const { success, reset } = await getLimiter(max).limit(key);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        },
      );
    }

    return null;
  } catch {
    // Redis unavailable — fail open (allow the request) to preserve availability.
    return null;
  }
}
