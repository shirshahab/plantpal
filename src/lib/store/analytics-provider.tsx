"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/store/auth-provider";
import { trackDailySession } from "@/lib/analytics/track";
import { expireTrialIfNeeded } from "@/lib/referrals/referral-trial";
import { claimReferrerTrialCredits } from "@/lib/referrals/index";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    expireTrialIfNeeded();
    claimReferrerTrialCredits();
    trackDailySession(user?.id ?? null);
  }, [user?.id]);

  useEffect(() => {
    const onSubUpdate = () => expireTrialIfNeeded();
    window.addEventListener("plantpal-subscription-updated", onSubUpdate);
    return () => window.removeEventListener("plantpal-subscription-updated", onSubUpdate);
  }, []);

  return <>{children}</>;
}
