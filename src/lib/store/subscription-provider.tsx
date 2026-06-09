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
  loadMockSubscription,
  setMockTier,
} from "@/lib/billing/subscription-state";
import { isDemoMode } from "@/lib/profile/user-profile";
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
  subscription: UserSubscription;
  setTier: (tier: AccountTier, billingCycle?: UserSubscription["billingCycle"]) => void;
  bypassLimits: boolean;
  /** True when beta env or founder mode grants full access */
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

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription>(() => loadMockSubscription());
  const [bypassLimits, setBypassLimits] = useState(false);
  const [accessRevision, setAccessRevision] = useState(0);
  const [scanRevision, setScanRevision] = useState(0);
  const { plants } = usePlants();

  useEffect(() => {
    hydrateFounderModeFromStorage();
    const sub = loadMockSubscription();
    setSubscription(sub);
    setBypassLimits(isDemoMode());
  }, []);

  useEffect(() => {
    const refreshSub = () => setSubscription(loadMockSubscription());
    window.addEventListener("plantpal-subscription-updated", refreshSub);
    return () => window.removeEventListener("plantpal-subscription-updated", refreshSub);
  }, []);

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

  const tier = subscription.tier;

  const accessOptions = useMemo(
    () => ({
      betaUnlockAll: betaUnlockAll || bypassLimits,
      bypassLimits: bypassLimits || betaUnlockAll,
      founderMode,
    }),
    [betaUnlockAll, bypassLimits, founderMode]
  );

  const setTier = useCallback(
    (next: AccountTier, billingCycle: UserSubscription["billingCycle"] = "monthly") => {
      const updated = setMockTier(next, billingCycle);
      setSubscription(updated);
    },
    []
  );

  const canUse = useCallback(
    (feature: BillingFeature | string) => canAccessFeature(tier, feature, accessOptions),
    [tier, accessOptions]
  );

  const canAddPlant = useCallback(
    () => canAddPlantCount(tier, plants.length, accessOptions),
    [tier, plants.length, accessOptions]
  );

  const unrestricted = betaUnlockAll || bypassLimits;

  const canScan = useCallback(
    () => canUseScan(tier, unrestricted),
    [tier, unrestricted, scanRevision]
  );

  const scanUsage = useMemo(() => getMonthlyScanUsage(), [scanRevision]);

  const usage = useMemo(
    () =>
      buildUsageSummary(
        tier,
        plants.length,
        getPlantLimit(tier, accessOptions),
        unrestricted
      ),
    [tier, plants.length, accessOptions, unrestricted, scanRevision]
  );

  const canAccessAcademyPathFn = useCallback(
    (pathId: string) => canAccessAcademyPathForTier(tier, pathId, accessOptions),
    [tier, accessOptions]
  );

  const value = useMemo(
    () => ({
      tier,
      subscription,
      setTier,
      bypassLimits,
      betaUnlockAll,
      founderMode,
      canUse,
      canAddPlant,
      canScan,
      plantLimit: getPlantLimit(tier, accessOptions),
      plantsRemaining: calcPlantsRemaining(tier, plants.length, accessOptions),
      plantCount: plants.length,
      scansUsed: scanUsage.scans,
      scanLimit: usage.scanLimit,
      scansRemaining: calcScansRemaining(tier, unrestricted),
      usage,
      canAccessAcademyPath: canAccessAcademyPathFn,
    }),
    [
      tier,
      subscription,
      setTier,
      bypassLimits,
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
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
