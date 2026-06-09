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
