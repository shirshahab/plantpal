import type { UserSubscription } from "@/lib/types/billing";
import { AccountTier, type AccountTier as Tier } from "./tier-config";
import { setSubscriptionTierCookie } from "./subscription-cookie";
import {
  ensureLaunchTrial,
  expireLaunchTrial,
  getEffectiveTier,
  isTrialActive,
  isTrialExpired,
} from "./trial";

export const SUBSCRIPTION_STORAGE_KEY = "plantpal-subscription";
export const LEGACY_TIER_STORAGE_KEY = "plantpal-subscription-tier";

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  tier: AccountTier.FREE,
  billingCycle: "monthly",
  trialStatus: "none",
  subscriptionStatus: "mock",
  planStartDate: null,
  planEndDate: null,
  trialStartedAt: null,
  trialEndsAt: null,
};

function normalizeSubscription(parsed: Partial<UserSubscription>): UserSubscription {
  let sub: UserSubscription = {
    ...DEFAULT_SUBSCRIPTION,
    ...parsed,
    subscriptionStatus:
      parsed.subscriptionStatus === "trialing"
        ? "trialing"
        : parsed.subscriptionStatus === "active"
          ? "active"
          : parsed.subscriptionStatus === "expired"
            ? "expired"
            : parsed.subscriptionStatus === "canceled"
              ? "canceled"
              : "mock",
  };

  if (isTrialExpired(sub)) {
    sub = expireLaunchTrial(sub);
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
      return normalizeSubscription({ ...DEFAULT_SUBSCRIPTION, tier: legacy });
    }
  } catch {
    /* ignore */
  }

  return DEFAULT_SUBSCRIPTION;
}

export function saveMockSubscription(subscription: UserSubscription): void {
  if (typeof window === "undefined") return;
  const effectiveTier = getEffectiveTier(subscription);
  localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
  localStorage.setItem(LEGACY_TIER_STORAGE_KEY, subscription.tier);
  setSubscriptionTierCookie(effectiveTier);
  window.dispatchEvent(new Event("plantpal-subscription-updated"));
}

/** Load subscription and auto-start 14-day launch trial for new users. */
export function loadSubscriptionWithTrial(): UserSubscription {
  const sub = loadMockSubscription();
  const withTrial = ensureLaunchTrial(sub);
  if (withTrial !== sub) {
    saveMockSubscription(withTrial);
  }
  return withTrial;
}

/** Mock upgrades are local-dev only; production must use verified store purchases. */
export function isMockPurchaseAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function setMockTier(tier: Tier, billingCycle: UserSubscription["billingCycle"] = "monthly"): UserSubscription {
  if (!isMockPurchaseAllowed()) {
    console.warn("[billing] Mock tier changes are disabled in production");
    return loadMockSubscription();
  }

  const next: UserSubscription = {
    ...loadMockSubscription(),
    tier,
    billingCycle,
    subscriptionStatus: tier === AccountTier.FREE ? "mock" : "active",
    planStartDate: tier === AccountTier.FREE ? null : new Date().toISOString(),
    planEndDate: null,
    trialStatus: tier === AccountTier.FREE ? loadMockSubscription().trialStatus : "converted",
  };
  saveMockSubscription(next);
  return next;
}

/** Apply verified store entitlement to local subscription cache (after purchase/restore/sync). */
export function applyVerifiedSubscription(patch: Partial<UserSubscription>): UserSubscription {
  const current = loadMockSubscription();
  const next: UserSubscription = normalizeSubscription({
    ...current,
    ...patch,
    subscriptionStatus:
      patch.subscriptionStatus ??
      (patch.tier && patch.tier !== AccountTier.FREE ? "active" : current.subscriptionStatus),
  });
  saveMockSubscription(next);
  return next;
}

export function expireTrialIfNeeded(): UserSubscription {
  const sub = loadMockSubscription();
  if (!isTrialActive(sub) && sub.trialStatus !== "active") return sub;
  if (!isTrialExpired(sub)) return sub;
  const next = expireLaunchTrial(sub);
  saveMockSubscription(next);
  return next;
}

/** @deprecated Use loadMockSubscription().tier */
export function loadSubscriptionTier(): Tier {
  return getEffectiveTier(loadMockSubscription());
}

/** @deprecated Use setMockTier */
export function saveSubscriptionTier(tier: Tier): void {
  setMockTier(tier);
}

export { getEffectiveTier, isTrialActive, isTrialExpired };
