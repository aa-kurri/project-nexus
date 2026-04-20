/**
 * In-memory sliding-window rate limiter.
 *
 * Usage:
 *   const limiter = rateLimit({ limit: 100, windowMs: 60_000 });
 *   const { success, remaining } = limiter.check(ip);
 *   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number; // epoch ms when window resets
}

interface WindowEntry {
  timestamps: number[];
}

export function rateLimit({ limit, windowMs }: RateLimitOptions) {
  const store = new Map<string, WindowEntry>();

  // Prune stale entries every 5 minutes to prevent memory leaks
  if (typeof setInterval !== "undefined") {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store.entries()) {
        entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
        if (entry.timestamps.length === 0) store.delete(key);
      }
    }, 5 * 60 * 1000);
  }

  return {
    check(identifier: string): RateLimitResult {
      const now = Date.now();
      const windowStart = now - windowMs;

      let entry = store.get(identifier);
      if (!entry) {
        entry = { timestamps: [] };
        store.set(identifier, entry);
      }

      // Slide the window — drop timestamps outside the window
      entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

      if (entry.timestamps.length >= limit) {
        const oldest = entry.timestamps[0];
        return {
          success:   false,
          remaining: 0,
          resetAt:   oldest + windowMs,
        };
      }

      entry.timestamps.push(now);
      return {
        success:   true,
        remaining: limit - entry.timestamps.length,
        resetAt:   now + windowMs,
      };
    },
  };
}

/** Shared limiters for API routes */
export const apiLimiter   = rateLimit({ limit: 100, windowMs: 60_000 }); // 100/min — general API
export const strictLimiter = rateLimit({ limit: 20,  windowMs: 60_000 }); // 20/min  — sensitive endpoints
