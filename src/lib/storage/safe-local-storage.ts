/**
 * Safe localStorage helpers — never throw; remove corrupt JSON keys on parse failure.
 */

const QUOTA_ERROR_NAMES = new Set(["QuotaExceededError"]);

export function isStorageQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name ?? "";
  const code = (error as { code?: number }).code;
  return (
    QUOTA_ERROR_NAMES.has(name) ||
    code === 22 ||
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "QuotaExceededError")
  );
}

export interface SafeSetItemResult {
  ok: boolean;
  quotaExceeded: boolean;
}

/** try/catch wrapper for localStorage.setItem — never throws. */
export function safeSetLocalStorageItem(key: string, value: string): SafeSetItemResult {
  if (typeof window === "undefined") return { ok: false, quotaExceeded: false };
  try {
    localStorage.setItem(key, value);
    return { ok: true, quotaExceeded: false };
  } catch (error) {
    if (isStorageQuotaError(error)) {
      return { ok: false, quotaExceeded: true };
    }
    console.error(`[safe-local-storage] setItem failed for ${key}`, error);
    return { ok: false, quotaExceeded: false };
  }
}

export function safeRemoveLocalStorageItem(key: string): void {
  removeLocalKey(key);
}

export function safeGetLocalStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function removeLocalKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readLocalJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    removeLocalKey(key);
    return fallback;
  }
}

export function writeLocalJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  safeSetLocalStorageItem(key, JSON.stringify(value));
}

/** Best-effort purge of unreadable plantpal-* keys after auth/storage failures. */
export function purgeCorruptPlantPalStorage(): number {
  if (typeof window === "undefined") return 0;
  let removed = 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("plantpal-")) keys.push(key);
    }
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      if (key.endsWith("-tier") || key === "plantpal-founder-mode") continue;
      try {
        JSON.parse(raw);
      } catch {
        localStorage.removeItem(key);
        removed++;
      }
    }
  } catch {
    /* ignore */
  }
  return removed;
}

/** Never touch Supabase auth keys — used by defensive cleanup elsewhere. */
export function isProtectedAuthStorageKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.startsWith("sb-") ||
    lower.startsWith("supabase") ||
    lower.includes("supabase.auth")
  );
}
