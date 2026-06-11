"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePlants } from "@/lib/store/plants-provider";
import { useAuth } from "@/lib/store/auth-provider";
import {
  hasFirstPlant,
  isOnboardingComplete,
  loadUserProfile,
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
  // Both ways of adding a first plant must stay reachable.
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
  const { loading: authLoading, profileReady } = useAuth();

  useEffect(() => {
    if (isBypassPath(pathname)) return;

    // Don't decide anything until the cloud profile has been hydrated for
    // this session. Redirecting earlier bounces signed-in users (with a
    // fresh localStorage) into onboarding they already finished.
    if (authLoading || !profileReady) return;

    if (!isOnboardingComplete()) {
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
  }, [pathname, router, plants.length, loading, authLoading, profileReady]);

  return <>{children}</>;
}
