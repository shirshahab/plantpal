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
import { isBetaUnlockAll } from "@/lib/billing/beta-unlock";
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
  betaUnlockAll: boolean;
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
  const [betaUnlockAll] = useState(() => isBetaUnlockAll());
  const { plants } = usePlants();

  const tier = subscription.tier;

  useEffect(() => {
    setSubscription(loadMockSubscription());
    setBypassLimits(isDemoMode());
  }, []);

  const accessOptions = useMemo(
    () => ({ betaUnlockAll, bypassLimits }),
    [betaUnlockAll, bypassLimits]
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
      canUse,
      canAddPlant,
      plantLimit: getPlantLimit(tier, accessOptions),
      plantsRemaining: calcPlantsRemaining(tier, plants.length, accessOptions),
      plantCount: plants.length,
    }),
    [tier, subscription, setTier, bypassLimits, betaUnlockAll, canUse, canAddPlant, plants.length, accessOptions]
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
