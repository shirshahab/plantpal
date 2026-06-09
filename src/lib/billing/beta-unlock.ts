/**
 * Beta / founder access overrides — full Plus + Family access without billing.
 *
 * Client (browser): set NEXT_PUBLIC_BETA_UNLOCK_ALL=true in .env.local
 * Server routes: BETA_UNLOCK_ALL=true also works
 * Local dev: enable Founder Mode in Settings → Developer Tools
 */

export const FOUNDER_MODE_STORAGE_KEY = "plantpal-founder-mode";
export const ACCESS_OVERRIDE_EVENT = "plantpal-access-override-changed";

export type AccessLevel = "restricted" | "full";

function parseEnvFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

/** Env-based beta flag (works on server; client needs NEXT_PUBLIC_ prefix). */
export function isBetaUnlockAll(): boolean {
  return (
    parseEnvFlag(process.env.NEXT_PUBLIC_BETA_UNLOCK_ALL) ||
    parseEnvFlag(process.env.BETA_UNLOCK_ALL)
  );
}

/** Founder Mode — localStorage override for developers (client only). */
export function isFounderModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FOUNDER_MODE_STORAGE_KEY) === "true";
}

export function setFounderModeEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  if (enabled) {
    localStorage.setItem(FOUNDER_MODE_STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(FOUNDER_MODE_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent(ACCESS_OVERRIDE_EVENT));
}

/**
 * True when beta env OR founder mode grants full access.
 * Use this for all subscription / feature gate checks.
 */
export function isBetaUnlocked(): boolean {
  return isBetaUnlockAll() || isFounderModeEnabled();
}

export function getAccessLevel(): AccessLevel {
  return isBetaUnlocked() ? "full" : "restricted";
}

/** Display label for settings when unrestricted access is active. */
export const BETA_TESTER_PLAN_LABEL = "Beta Tester";

export function getEffectivePlanLabel(
  tierLabel: string,
  unrestricted: boolean
): string {
  return unrestricted ? BETA_TESTER_PLAN_LABEL : tierLabel;
}
