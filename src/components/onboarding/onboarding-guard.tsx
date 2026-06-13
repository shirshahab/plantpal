"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePlants } from "@/lib/store/plants-provider";
import { useAuth } from "@/lib/store/auth-provider";
import {
  hasFirstPlant,
  isOnboardingComplete,
  loadUserProfile,
  saveUserProfile,
} from "@/lib/profile/user-profile";

const BYPASS_PREFIXES = [
  "/onboarding",
  "/login",
  "/signup",
  "/beta-start",
  "/tester-guide",
  "/qa",
  "/setup",
  "/debug",
  "/offline",
];

function isBypassPath(pathname: string): boolean {
  if (pathname === "/plants/new") return true;
  if (pathname === "/scanner" || pathname.startsWith("/scanner/")) return true;
  return BYPASS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { plants, loading } = usePlants();
  const { loading: authLoading, profileReady, user, cloudOnboardingComplete, profileSnapshot, isMockMode } =
    useAuth();

  useEffect(() => {
    if (isBypassPath(pathname)) return;
    if (authLoading || !profileReady) return;

    if (!user && !isMockMode) {
      router.replace("/login");
      return;
    }

    // Logged-in: Supabase profile is source of truth. Cloud completion
    // overrides a stale local incomplete flag on a new device.
    if (user && cloudOnboardingComplete === true) {
      if (!isOnboardingComplete()) {
        saveUserProfile({ onboardingComplete: true });
      }
      // fall through to first-plant check
    } else if (!isOnboardingComplete()) {
      router.replace("/onboarding");
      return;
    }

    if (loading) return;

    const needsFirstPlant =
      !hasFirstPlant() &&
      plants.length === 0 &&
      !loadUserProfile().firstPlantSkipped;

    if (needsFirstPlant && pathname !== "/plants/new") {
      router.replace("/plants/new?first=1");
    }
  }, [
    pathname,
    router,
    plants.length,
    loading,
    authLoading,
    profileReady,
    user,
    cloudOnboardingComplete,
    profileSnapshot,
    isMockMode,
  ]);

  return <>{children}</>;
}
