/**
 * User-scoped onboarding state — never shared across Supabase accounts.
 * Canonical key: plantpal-onboarding:{userId}
 */

export const ONBOARDING_KEY_PREFIX = "plantpal-onboarding:";

export interface UserOnboardingState {
  complete: boolean;
  completedAt?: string;
}

export function onboardingStorageKey(userId: string): string {
  return `${ONBOARDING_KEY_PREFIX}${userId}`;
}

export function loadUserOnboardingState(userId: string): UserOnboardingState {
  if (typeof window === "undefined" || !userId) {
    return { complete: false };
  }
  try {
    const raw = localStorage.getItem(onboardingStorageKey(userId));
    if (!raw) return { complete: false };
    const parsed = JSON.parse(raw) as UserOnboardingState;
    return { complete: parsed.complete === true, completedAt: parsed.completedAt };
  } catch {
    return { complete: false };
  }
}

export function markUserOnboardingComplete(userId: string): UserOnboardingState {
  const state: UserOnboardingState = {
    complete: true,
    completedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined" && userId) {
    localStorage.setItem(onboardingStorageKey(userId), JSON.stringify(state));
  }
  return state;
}

export function isOnboardingCompleteForUser(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return loadUserOnboardingState(userId).complete;
}

/** Cloud or scoped-local onboarding for the signed-in user only. */
export function resolveOnboardingCompleteForUser(
  userId: string | null | undefined,
  cloudComplete: boolean | null | undefined
): boolean {
  if (!userId) return false;
  if (cloudComplete === true) return true;
  return isOnboardingCompleteForUser(userId);
}
