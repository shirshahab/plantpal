"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePlants } from "@/lib/store/plants-provider";
import { useAuth } from "@/lib/store/auth-provider";
import {
  hasFirstPlant,
  isOnboardingComplete,
  loadUserProfile,
  saveUserProfile,
} from "@/lib/profile/user-profile";
import { resolveOnboardingCompleteForUser } from "@/lib/auth/onboarding-state";
import { traceAuthEvent } from "@/lib/auth/lifecycle-trace";

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
  const {
    loading: authLoading,
    sessionReady,
    profileReady,
    user,
    cloudOnboardingComplete,
    isMockMode,
  } = useAuth();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isBypassPath(pathname)) return;
    if (authLoading || !sessionReady) return;

    if (!user && !isMockMode) {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      const next = encodeURIComponent(pathname || "/dashboard");
      traceAuthEvent({
        event: "REDIRECT_TO_LOGIN",
        hasSession: false,
        redirectTarget: `/login?next=${next}`,
        reason: "onboarding guard no user",
      });
      router.replace(`/login?next=${next}`);
      return;
    }

    if (!profileReady || !user) return;

    const onboarded = resolveOnboardingCompleteForUser(user.id, cloudOnboardingComplete);

    traceAuthEvent({
      event: "ONBOARDING_STATUS",
      hasSession: true,
      userId: user.id,
      onboardingComplete: onboarded,
      reason: `guard path=${pathname}`,
    });

    if (onboarded) {
      if (!isOnboardingComplete(user.id)) {
        saveUserProfile({ ownerUserId: user.id, onboardingComplete: true });
      }
    } else {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      traceAuthEvent({
        event: "REDIRECT_TO_ONBOARDING",
        hasSession: true,
        userId: user.id,
        onboardingComplete: false,
        redirectTarget: "/onboarding",
        reason: "incomplete onboarding",
      });
      router.replace("/onboarding");
      return;
    }

    if (loading) return;

    const needsFirstPlant =
      !hasFirstPlant(user.id) &&
      plants.length === 0 &&
      loadUserProfile().ownerUserId === user.id &&
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
    sessionReady,
    profileReady,
    user,
    cloudOnboardingComplete,
    isMockMode,
  ]);

  useEffect(() => {
    redirectedRef.current = false;
  }, [pathname, user?.id]);

  return <>{children}</>;
}
