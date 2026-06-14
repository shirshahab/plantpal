"use client";

/**
 * Onboarding redirects disabled while auth stabilizes.
 * AuthSessionGate handles login; dashboard shows setup banner instead.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
