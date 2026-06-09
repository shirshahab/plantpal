import type { UserProfile } from "@/lib/types/profile";
import { DEFAULT_PROFILE } from "@/lib/types/profile";

export const PROFILE_STORAGE_KEY = "plantpal-user-profile";
export const DEMO_MODE_KEY = "plantpal-demo-mode";

export function loadUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const next = { ...loadUserProfile(), ...profile };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  if (profile.demoMode !== undefined) {
    localStorage.setItem(DEMO_MODE_KEY, profile.demoMode ? "1" : "0");
  }
  return next;
}

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_MODE_KEY) === "1" || loadUserProfile().demoMode;
}

export function isOnboardingComplete(): boolean {
  return loadUserProfile().onboardingComplete;
}
