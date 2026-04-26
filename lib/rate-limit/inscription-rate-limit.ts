// TODO: migrate to Upstash Redis for multi-instance rate limiting

const ipBuckets = new Map<string, { count: number; resetAt: number }>();

const LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1h

export function checkInscriptionRateLimit(
  ip: string,
): { ok: boolean; remaining: number; resetIn: number } {
  const now = Date.now();

  // Prune expired entries to prevent unbounded growth
  for (const [key, entry] of ipBuckets) {
    if (now > entry.resetAt) ipBuckets.delete(key);
  }

  const entry = ipBuckets.get(ip);

  if (!entry || now > entry.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: LIMIT - 1, resetIn: WINDOW_MS };
  }

  if (entry.count >= LIMIT) {
    return {
      ok: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return {
    ok: true,
    remaining: LIMIT - entry.count,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}
