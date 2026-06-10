"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/store/auth-provider";
import { trackDailySession, trackEvent } from "@/lib/analytics/track";
import { expireTrialIfNeeded } from "@/lib/referrals/referral-trial";
import { claimReferrerTrialCredits } from "@/lib/referrals/index";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    expireTrialIfNeeded();
    claimReferrerTrialCredits();
    trackDailySession(user?.id ?? null);
  }, [user?.id]);

  // Page views — dedupe consecutive renders of the same route.
  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    trackEvent("page_view", { path: pathname });
  }, [pathname]);

  useEffect(() => {
    const onSubUpdate = () => expireTrialIfNeeded();
    window.addEventListener("plantpal-subscription-updated", onSubUpdate);
    return () => window.removeEventListener("plantpal-subscription-updated", onSubUpdate);
  }, []);

  return <>{children}</>;
}
