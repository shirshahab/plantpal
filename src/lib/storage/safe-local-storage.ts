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
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function safeGetLocalStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
