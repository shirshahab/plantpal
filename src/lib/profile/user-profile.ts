import type { UserProfile } from "@/lib/types/profile";
import { DEFAULT_PROFILE } from "@/lib/types/profile";
import { isProtectedAuthStorageKey } from "@/lib/storage/safe-local-storage";
import {
  isOnboardingCompleteForUser,
  markUserOnboardingComplete,
} from "@/lib/auth/onboarding-state";

export const PROFILE_STORAGE_KEY = "plantpal-user-profile";

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
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const next = { ...loadUserProfile(), ...profile };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  if (next.ownerUserId && next.onboardingComplete) {
    markUserOnboardingComplete(next.ownerUserId);
  }
  return next;
}

/** Reset app profile cache when a different Supabase user signs in. */
export function ensureProfileForUser(userId: string): UserProfile {
  const current = loadUserProfile();
  if (current.ownerUserId === userId) return current;
  const fresh: UserProfile = { ...DEFAULT_PROFILE, ownerUserId: userId };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

/**
 * Onboarding complete for a specific user only.
 * Never returns true without a userId — stale generic local state is ignored.
 */
export function isOnboardingComplete(userId?: string | null): boolean {
  if (!userId) return false;
  if (isOnboardingCompleteForUser(userId)) return true;
  const profile = loadUserProfile();
  if (profile.ownerUserId === userId && profile.onboardingComplete) return true;
  return false;
}

export function hasFirstPlant(userId?: string | null): boolean {
  const profile = loadUserProfile();
  if (userId && profile.ownerUserId && profile.ownerUserId !== userId) return false;
  return profile.firstPlantAdded === true;
}

export function markFirstPlantAdded(userId?: string | null): UserProfile {
  return saveUserProfile({
    ...(userId ? { ownerUserId: userId } : {}),
    firstPlantAdded: true,
  });
}

export function clearLocalProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem("plantpal-founder-mode");
  } catch {
    /* ignore */
  }
}

const SIGNOUT_KEEP_KEYS = new Set([
  "plantpal-install-dismissed",
  "plantpal-qa-checklist",
  "plantpal-beta-welcome-dismissed",
]);

/** Explicit sign-out only — never called from guards or hydration. */
export function clearAllUserLocalData(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (isProtectedAuthStorageKey(key)) continue;
      if (key.startsWith("plantpal-") && !SIGNOUT_KEEP_KEYS.has(key)) {
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
