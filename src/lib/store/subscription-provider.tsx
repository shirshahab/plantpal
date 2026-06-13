"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AccountTier } from "@/lib/billing/tier-config";
import type { BillingFeature } from "@/lib/billing/feature-gates";
import type { UserSubscription } from "@/lib/types/billing";
import {
  canAccessFeature,
  canAddPlantCount,
  getPlantLimit,
  plantsRemaining as calcPlantsRemaining,
  canAccessAcademyPathForTier,
} from "@/lib/billing/account-tiers";
import {
  ACCESS_OVERRIDE_EVENT,
  hydrateFounderModeFromStorage,
  isBetaUnlocked,
  isFounderMode,
} from "@/lib/billing/beta-unlock";
import {
  applyVerifiedSubscription,
  getEffectiveTier,
  isTrialActive,
  isVerifiedSubscription,
  loadMockSubscription,
  loadVerifiedSubscriptionState,
  setMockTier,
  expireTrialIfNeeded,
  isMockPurchaseAllowed,
} from "@/lib/billing/subscription-state";
import { trialDaysRemaining } from "@/lib/billing/trial";
import { usePlants } from "@/lib/store/plants-provider";
import {
  buildUsageSummary,
  canUseScan,
  getMonthlyScanUsage,
  scansRemaining as calcScansRemaining,
  type UsageSummary,
} from "@/lib/billing/usage-tracking";

interface SubscriptionContextValue {
  tier: AccountTier;
  effectiveTier: AccountTier;
  subscription: UserSubscription;
  trialActive: boolean;
  trialDaysLeft: number | null;
  setTier: (tier: AccountTier, billingCycle?: UserSubscription["billingCycle"]) => void;
  refreshSubscription: () => void;
  bypassLimits: boolean;
  betaUnlockAll: boolean;
  founderMode: boolean;
  canUse: (feature: BillingFeature | string) => boolean;
  canAddPlant: () => boolean;
  canScan: () => boolean;
  plantLimit: number | null;
  plantsRemaining: number | null;
  plantCount: number;
  scansUsed: number;
  scanLimit: number | null;
  scansRemaining: number | null;
  usage: UsageSummary;
  canAccessAcademyPath: (pathId: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

async function fetchServerSubscription(): Promise<Partial<UserSubscription> | null> {
  try {
    const res = await fetch("/api/billing/sync", { method: "GET", credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; subscription?: Partial<UserSubscription> | null };
    return data.ok && data.subscription ? data.subscription : null;
  } catch {
    return null;
  }
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription>(() => loadMockSubscription());
  const [accessRevision, setAccessRevision] = useState(0);
  const [scanRevision, setScanRevision] = useState(0);
  const { plants } = usePlants();

  const refreshSubscription = useCallback(() => {
    expireTrialIfNeeded();
    setSubscription(loadVerifiedSubscriptionState());
  }, []);

  useEffect(() => {
    hydrateFounderModeFromStorage();
    refreshSubscription();

    void (async () => {
      const serverSub = await fetchServerSubscription();
      if (serverSub) {
        setSubscription(applyVerifiedSubscription(serverSub));
      }
    })();
  }, [refreshSubscription]);

  useEffect(() => {
    const refreshSub = () => refreshSubscription();
    window.addEventListener("plantpal-subscription-updated", refreshSub);
    return () => window.removeEventListener("plantpal-subscription-updated", refreshSub);
  }, [refreshSubscription]);

  useEffect(() => {
    const refresh = () => setAccessRevision((n) => n + 1);
    const refreshScans = () => setScanRevision((n) => n + 1);
    window.addEventListener(ACCESS_OVERRIDE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("plantpal-scan-usage-updated", refreshScans);
    return () => {
      window.removeEventListener(ACCESS_OVERRIDE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("plantpal-scan-usage-updated", refreshScans);
    };
  }, []);

  const betaUnlockAll = useMemo(() => isBetaUnlocked(), [accessRevision]);
  const founderMode = useMemo(() => isFounderMode(), [accessRevision]);
  const verifiedTrialActive = isTrialActive(subscription) && isVerifiedSubscription(subscription);
  const effectiveTier = getEffectiveTier(subscription);
  const tier = effectiveTier;

  const accessOptions = useMemo(
    () => ({
      betaUnlockAll,
      bypassLimits: betaUnlockAll,
      founderMode,
      trialFullAccess: verifiedTrialActive,
      subscription,
    }),
    [betaUnlockAll, founderMode, verifiedTrialActive, subscription]
  );

  const setTier = useCallback(
    (next: AccountTier, billingCycle: UserSubscription["billingCycle"] = "monthly") => {
      if (!isMockPurchaseAllowed()) {
        console.warn("[billing] setTier is disabled in production; use store purchase flow");
        return;
      }
      const updated = setMockTier(next, billingCycle);
      setSubscription(updated);
    },
    []
  );

  const canUse = useCallback(
    (feature: BillingFeature | string) =>
      canAccessFeature(effectiveTier, feature, accessOptions),
    [effectiveTier, accessOptions]
  );

  const canAddPlant = useCallback(
    () => canAddPlantCount(effectiveTier, plants.length, accessOptions),
    [effectiveTier, plants.length, accessOptions]
  );

  const unrestricted = betaUnlockAll || founderMode || verifiedTrialActive;

  const canScan = useCallback(
    () => canUseScan(effectiveTier, unrestricted),
    [effectiveTier, unrestricted, scanRevision]
  );

  const scanUsage = useMemo(() => getMonthlyScanUsage(), [scanRevision]);

  const usage = useMemo(
    () =>
      buildUsageSummary(
        effectiveTier,
        plants.length,
        getPlantLimit(effectiveTier, accessOptions),
        unrestricted
      ),
    [effectiveTier, plants.length, accessOptions, unrestricted, scanRevision]
  );

  const canAccessAcademyPathFn = useCallback(
    (pathId: string) => canAccessAcademyPathForTier(effectiveTier, pathId, accessOptions),
    [effectiveTier, accessOptions]
  );

  const value = useMemo(
    () => ({
      tier,
      effectiveTier,
      subscription,
      trialActive: verifiedTrialActive,
      trialDaysLeft: verifiedTrialActive ? trialDaysRemaining(subscription) : null,
      setTier,
      refreshSubscription,
      bypassLimits: unrestricted,
      betaUnlockAll,
      founderMode,
      canUse,
      canAddPlant,
      canScan,
      plantLimit: getPlantLimit(effectiveTier, accessOptions),
      plantsRemaining: calcPlantsRemaining(effectiveTier, plants.length, accessOptions),
      plantCount: plants.length,
      scansUsed: scanUsage.scans,
      scanLimit: usage.scanLimit,
      scansRemaining: calcScansRemaining(effectiveTier, unrestricted),
      usage,
      canAccessAcademyPath: canAccessAcademyPathFn,
    }),
    [
      tier,
      effectiveTier,
      subscription,
      verifiedTrialActive,
      setTier,
      refreshSubscription,
      unrestricted,
      betaUnlockAll,
      founderMode,
      canUse,
      canAddPlant,
      canScan,
      plants.length,
      accessOptions,
      scanUsage.scans,
      usage,
      canAccessAcademyPathFn,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
