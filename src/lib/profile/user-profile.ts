import type { UserProfile } from "@/lib/types/profile";
import { DEFAULT_PROFILE } from "@/lib/types/profile";

export const PROFILE_STORAGE_KEY = "plantpal-user-profile";

/** Legacy demo-mode keys — purged on load (Phase 37.5: public beta, no demo mode). */
const LEGACY_DEMO_KEYS = ["plantpal-demo-mode"];

function purgeLegacyDemoState(): void {
  try {
    for (const key of LEGACY_DEMO_KEYS) {
      if (localStorage.getItem(key) !== null) localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

export function loadUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    purgeLegacyDemoState();
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as UserProfile & { demoMode?: boolean };
    if (parsed.demoMode !== undefined) {
      delete parsed.demoMode;
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(parsed));
    }
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const next = { ...loadUserProfile(), ...profile };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isOnboardingComplete(): boolean {
  return loadUserProfile().onboardingComplete;
}

export function hasFirstPlant(): boolean {
  return loadUserProfile().firstPlantAdded === true;
}

export function markFirstPlantAdded(): UserProfile {
  return saveUserProfile({ firstPlantAdded: true });
}

/**
 * Clears the locally cached profile on sign-out so a different account on
 * the same browser doesn't inherit onboarding flags, ZIP, or founder mode.
 */
export function clearLocalProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem("plantpal-founder-mode");
  } catch {
    /* ignore */
  }
}

/** Keys that are allowed to survive sign-out (UI prefs, not user data). */
const SIGNOUT_KEEP_KEYS = new Set([
  "plantpal-install-dismissed",
  "plantpal-qa-checklist",
  "plantpal-beta-welcome-dismissed",
]);

/**
 * Clears all user-owned localStorage on sign-out so the next account on
 * this browser does not inherit plants, tasks, diagnoses, or social data.
 */
export function clearAllUserLocalData(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("plantpal-") && !SIGNOUT_KEEP_KEYS.has(key)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
