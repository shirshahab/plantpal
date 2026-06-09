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
  plantLimit: number | null;
  plantsRemaining: number | null;
  plantCount: number;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription>(() => loadMockSubscription());
  const [bypassLimits, setBypassLimits] = useState(false);
  const [accessRevision, setAccessRevision] = useState(0);
  const { plants } = usePlants();

  useEffect(() => {
    hydrateFounderModeFromStorage();
    setSubscription(loadMockSubscription());
    setBypassLimits(isDemoMode());
  }, []);

  useEffect(() => {
    const refresh = () => setAccessRevision((n) => n + 1);
    window.addEventListener(ACCESS_OVERRIDE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ACCESS_OVERRIDE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
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
      plantLimit: getPlantLimit(tier, accessOptions),
      plantsRemaining: calcPlantsRemaining(tier, plants.length, accessOptions),
      plantCount: plants.length,
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
      plants.length,
      accessOptions,
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
