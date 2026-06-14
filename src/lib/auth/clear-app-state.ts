import { isProtectedAuthStorageKey } from "@/lib/storage/safe-local-storage";

/** UI prefs that survive a debug reset. */
const DEBUG_RESET_KEEP = new Set([
  "plantpal-install-dismissed",
  "plantpal-qa-checklist",
  "plantpal-beta-welcome-dismissed",
]);

/**
 * Remove PlantPal app localStorage only — never Supabase auth keys (sb-, supabase).
 */
export function clearPlantPalAppState(): number {
  if (typeof window === "undefined") return 0;
  let removed = 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (isProtectedAuthStorageKey(key)) continue;
      if (key.startsWith("plantpal-") && !DEBUG_RESET_KEEP.has(key)) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      localStorage.removeItem(key);
      removed++;
    }
  } catch {
    /* ignore */
  }
  return removed;
}
