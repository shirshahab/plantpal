import type { UserSubscription } from "@/lib/types/billing";
import { AccountTier, type AccountTier as Tier } from "./tier-config";
import { setSubscriptionTierCookie } from "./subscription-cookie";

export const SUBSCRIPTION_STORAGE_KEY = "plantpal-subscription";
export const LEGACY_TIER_STORAGE_KEY = "plantpal-subscription-tier";

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  tier: AccountTier.FREE,
  billingCycle: "monthly",
  trialStatus: "none",
  subscriptionStatus: "mock",
  planStartDate: null,
  planEndDate: null,
};

function normalizeSubscription(parsed: Partial<UserSubscription>): UserSubscription {
  const sub: UserSubscription = {
    ...DEFAULT_SUBSCRIPTION,
    ...parsed,
    subscriptionStatus:
      parsed.subscriptionStatus === "trialing"
        ? "trialing"
        : parsed.subscriptionStatus === "active"
          ? "active"
          : "mock",
  };

  if (
    sub.trialStatus === "active" &&
    sub.planEndDate &&
    new Date(sub.planEndDate).getTime() < Date.now()
  ) {
    return {
      ...sub,
      tier: AccountTier.FREE,
      trialStatus: "expired",
      subscriptionStatus: "expired",
    };
  }

  return sub;
}

export function loadMockSubscription(): UserSubscription {
  if (typeof window === "undefined") return DEFAULT_SUBSCRIPTION;

  try {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserSubscription>;
      if (parsed.tier === "free" || parsed.tier === "plus" || parsed.tier === "family") {
        return normalizeSubscription(parsed);
      }
    }

    const legacy = localStorage.getItem(LEGACY_TIER_STORAGE_KEY);
    if (legacy === "plus" || legacy === "family" || legacy === "free") {
      return { ...DEFAULT_SUBSCRIPTION, tier: legacy };
    }
  } catch {
    /* ignore */
  }

  return DEFAULT_SUBSCRIPTION;
}

export function saveMockSubscription(subscription: UserSubscription): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
  localStorage.setItem(LEGACY_TIER_STORAGE_KEY, subscription.tier);
  setSubscriptionTierCookie(subscription.tier);
  window.dispatchEvent(new Event("plantpal-subscription-updated"));
}

export function setMockTier(tier: Tier, billingCycle: UserSubscription["billingCycle"] = "monthly"): UserSubscription {
  const next: UserSubscription = {
    ...loadMockSubscription(),
    tier,
    billingCycle,
    subscriptionStatus: tier === AccountTier.FREE ? "mock" : "mock",
    planStartDate: tier === AccountTier.FREE ? null : new Date().toISOString(),
    planEndDate: null,
  };
  saveMockSubscription(next);
  return next;
}

/** @deprecated Use loadMockSubscription().tier */
export function loadSubscriptionTier(): Tier {
  return loadMockSubscription().tier;
}

/** @deprecated Use setMockTier */
export function saveSubscriptionTier(tier: Tier): void {
  setMockTier(tier);
}
