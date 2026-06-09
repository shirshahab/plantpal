/**
 * In-memory TTL cache for server-side API responses.
 * Survives within a single server instance / dev session.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheKey(parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(":");
}

/** Default TTLs (ms) */
export const CACHE_TTL = {
  weather: 45 * 60 * 1000,
  plantSearch: 30 * 60 * 1000,
  priceSearch: 60 * 60 * 1000,
} as const;

export function cacheStats(): { size: number } {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now > v.expiresAt) store.delete(k);
  }
  return { size: store.size };
}
