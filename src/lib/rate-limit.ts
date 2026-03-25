// Simple in-memory rate limiter
const hits = new Map<string, { count: number; resetAt: number }>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    hits.forEach((val, key) => {
      if (now > val.resetAt) hits.delete(key);
    });
  }, 5 * 60 * 1000);
}

export function rateLimit(
  ip: string,
  route: string,
  maxRequests: number,
  windowMs: number
): { ok: boolean; remaining: number } {
  const key = `${ip}:${route}`;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { ok: false, remaining: 0 };
  }

  return { ok: true, remaining: maxRequests - entry.count };
}
