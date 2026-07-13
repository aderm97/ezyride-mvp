// Simple in-memory fixed-window rate limiter (per process).
// Designed to throttle *failed* auth attempts without punishing legitimate
// users: check is read-only, you record an attempt only on failure, and a
// success clears the counter. For multi-instance production, back this with
// Redis/Upstash behind the same three functions.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // seconds until the window resets
}

/** Read-only check — does NOT consume an attempt. */
export function isRateLimited(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) return { ok: true, retryAfter: 0 };
  if (b.count >= limit) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

/** Record one attempt against the window (call this only on failure). */
export function recordAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  b.count += 1;
}

/** Clear the counter (call on a successful auth so good users never accrue). */
export function clearLimit(key: string): void {
  buckets.delete(key);
}

/** Best-effort client IP from proxy headers (Vercel/Render set x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
