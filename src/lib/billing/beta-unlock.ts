/**
 * Beta / founder access overrides — full Plus + Family access without billing.
 *
 * Client: localStorage + user profile flag + cookie (for API rate limits)
 * Server: BETA_UNLOCK_ALL env OR founder-mode cookie on requests
 */

import { loadUserProfile, saveUserProfile } from "@/lib/profile/user-profile";

export const FOUNDER_MODE_STORAGE_KEY = "plantpal-founder-mode";
export const FOUNDER_MODE_COOKIE = "plantpal-founder-mode";
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

function readProfileFounderFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return loadUserProfile().founderMode === true;
  } catch {
    return false;
  }
}

function readLocalFounderFlag(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FOUNDER_MODE_STORAGE_KEY) === "true";
}

/** Sync cookie so server API routes can bypass rate limits when founder mode is on. */
export function syncFounderModeCookie(enabled: boolean): void {
  if (typeof window === "undefined") return;
  const maxAge = enabled ? 60 * 60 * 24 * 365 : 0;
  document.cookie = `${FOUNDER_MODE_COOKIE}=${enabled ? "true" : ""}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Founder Mode — localStorage + profile flag (client only). */
export function isFounderModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return readLocalFounderFlag() || readProfileFounderFlag();
}

/** Primary check — use before all subscription gates. */
export function isFounderMode(): boolean {
  return isFounderModeEnabled();
}

export function setFounderModeEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;

  if (enabled) {
    localStorage.setItem(FOUNDER_MODE_STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(FOUNDER_MODE_STORAGE_KEY);
  }

  saveUserProfile({ founderMode: enabled });
  syncFounderModeCookie(enabled);
  window.dispatchEvent(new CustomEvent(ACCESS_OVERRIDE_EVENT));
}

/** Server: read founder cookie from incoming request. */
export function isFounderModeFromRequest(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  return /(?:^|;\s*)plantpal-founder-mode=true(?:;|$)/.test(cookie);
}

/**
 * True when beta env OR founder mode grants full access.
 * Pass `request` on server routes for cookie-based founder bypass.
 */
export function isBetaUnlocked(request?: Request): boolean {
  if (isBetaUnlockAll()) return true;
  if (request && isFounderModeFromRequest(request)) return true;
  if (typeof window !== "undefined") return isFounderModeEnabled();
  return false;
}

/** Alias for subscription checks — founder overrides Free / Plus / Pro. */
export function hasUnrestrictedAccess(request?: Request): boolean {
  return isBetaUnlocked(request);
}

export function getAccessLevel(request?: Request): AccessLevel {
  return isBetaUnlocked(request) ? "full" : "restricted";
}

export const BETA_TESTER_PLAN_LABEL = "Beta Tester";
export const FOUNDER_PLAN_LABEL = "Founder Mode";

export function getEffectivePlanLabel(
  tierLabel: string,
  options: { unrestricted?: boolean; founderMode?: boolean } = {}
): string {
  if (options.founderMode) return FOUNDER_PLAN_LABEL;
  if (options.unrestricted) return BETA_TESTER_PLAN_LABEL;
  return tierLabel;
}

/** Call once on app load to align cookie with stored founder state. */
export function hydrateFounderModeFromStorage(): void {
  if (typeof window === "undefined") return;
  const enabled = readLocalFounderFlag() || readProfileFounderFlag();
  if (enabled) {
    localStorage.setItem(FOUNDER_MODE_STORAGE_KEY, "true");
    saveUserProfile({ founderMode: true });
  }
  syncFounderModeCookie(enabled);
}
