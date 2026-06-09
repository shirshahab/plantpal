"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePlants } from "@/lib/store/plants-provider";
import {
  hasFirstPlant,
  isOnboardingComplete,
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
  return BYPASS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { plants, loading } = usePlants();

  useEffect(() => {
    if (isBypassPath(pathname)) return;

    if (!isOnboardingComplete()) {
      router.replace("/onboarding");
      return;
    }

    if (loading) return;

    const needsFirstPlant = !hasFirstPlant() && plants.length === 0;

    if (needsFirstPlant && pathname !== "/plants/new") {
      router.replace("/plants/new?first=1");
    }
  }, [pathname, router, plants.length, loading]);

  return <>{children}</>;
}
