"use client";

import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";
import { AuthProvider, useAuth } from "@/lib/store/auth-provider";

/**
 * Onboarding wrapper — mounts AuthProvider so session state matches the app shell.
 * Never signs the user out on transient auth read failures.
 */
export function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OnboardingSessionReady>{children}</OnboardingSessionReady>
    </AuthProvider>
  );
}

function OnboardingSessionReady({ children }: { children: React.ReactNode }) {
  const { loading, profileReady, isMockMode } = useAuth();

  if (!isMockMode && (loading || !profileReady)) {
    return <AuthLoadingScreen message="Checking your garden paperwork…" />;
  }

  return <>{children}</>;
}
