/**
 * Billing and trial tests for App Store launch.
 * Usage: npm run test:billing
 */
import assert from "node:assert/strict";
import { AccountTier } from "../src/lib/billing/tier-config";
import {
  getEffectiveTier,
  expireLaunchTrial,
  isTrialActive,
  isVerifiedSubscription,
  isLocalTrialAutoStartEnabled,
  LAUNCH_TRIAL_DAYS,
} from "../src/lib/billing/trial";
import {
  loadVerifiedSubscriptionState,
  sanitizeUnverifiedSubscription,
} from "../src/lib/billing/subscription-state";
import { canAccessFeature } from "../src/lib/billing/account-tiers";
import { isDevUnlockAllFeatures } from "../src/lib/billing/dev-unlock";
import { PUBLIC_BETA_UNLOCK_ALL } from "../src/lib/billing/limits";
import { OFFICIAL_PRICING, formatPrice } from "../src/lib/billing/pricing";
import { buildPaywallPlans } from "../src/lib/subscription/plans";
import { STORE_PRODUCTS } from "../src/lib/billing/store-products";
import type { UserSubscription } from "../src/lib/types/billing";

const baseSub: UserSubscription = {
  tier: AccountTier.FREE,
  billingCycle: "monthly",
  trialStatus: "none",
  subscriptionStatus: "mock",
  planStartDate: null,
  planEndDate: null,
};

function verifiedTrialSub(overrides: Partial<UserSubscription> = {}): UserSubscription {
  const end = new Date();
  end.setDate(end.getDate() + LAUNCH_TRIAL_DAYS);
  return {
    ...baseSub,
    tier: AccountTier.PLUS,
    trialStatus: "active",
    subscriptionStatus: "trialing",
    trialStartedAt: new Date().toISOString(),
    trialEndsAt: end.toISOString(),
    planEndDate: end.toISOString(),
    storePlatform: "ios",
    storeProductId: "com.getplantpal.pro.monthly",
    ...overrides,
  };
}

function testNewUserWithoutStoreTrialStaysFree() {
  const fresh = sanitizeUnverifiedSubscription(baseSub);
  assert.equal(getEffectiveTier(fresh), AccountTier.FREE);
  assert.equal(isTrialActive(fresh), false);
  assert.ok(
    !canAccessFeature(AccountTier.FREE, "ai_doctor", { subscription: fresh })
  );
  console.log("✓ New user without verified store trial stays Free");
}

function testVerifiedRevenueCatTrialUnlocksAccess() {
  const trialing = verifiedTrialSub();
  assert.ok(isVerifiedSubscription(trialing));
  assert.ok(isTrialActive(trialing));
  assert.equal(getEffectiveTier(trialing), AccountTier.PLUS);
  assert.ok(
    canAccessFeature(getEffectiveTier(trialing), "ai_doctor", { subscription: trialing })
  );
  console.log("✓ Verified RevenueCat trial unlocks paid access");
}

function testClientOnlyLocalTrialBlockedInProduction() {
  const localOnly: UserSubscription = {
    ...baseSub,
    tier: AccountTier.PLUS,
    trialStatus: "active",
    subscriptionStatus: "trialing",
    trialStartedAt: new Date().toISOString(),
    trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    planEndDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  };
  assert.equal(isVerifiedSubscription(localOnly), false);
  const sanitized = sanitizeUnverifiedSubscription(localOnly);
  assert.equal(getEffectiveTier(sanitized), AccountTier.FREE);

  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  assert.equal(isLocalTrialAutoStartEnabled(), false);
  process.env.NODE_ENV = prev;
  console.log("✓ Client-only local trial does not unlock in production");
}

function testExpiredVerifiedTrialLocksPro() {
  const expired = expireLaunchTrial(
    verifiedTrialSub({
      trialStartedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      trialEndsAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      planEndDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    })
  );
  assert.equal(expired.trialStatus, "expired");
  assert.equal(getEffectiveTier(expired), AccountTier.FREE);
  console.log("✓ Expired verified trial locks Pro features");
}

function testPaidProUnlocks() {
  const paid: UserSubscription = {
    ...baseSub,
    tier: AccountTier.PLUS,
    subscriptionStatus: "active",
    trialStatus: "converted",
    storePlatform: "ios",
    storeProductId: "com.getplantpal.pro.monthly",
  };
  assert.equal(getEffectiveTier(paid), AccountTier.PLUS);
  assert.ok(canAccessFeature(AccountTier.PLUS, "ai_doctor", { subscription: paid }));
  console.log("✓ Paid Pro unlocks Pro features");
}

function testPaidFamilyUnlocksFamily() {
  const paid: UserSubscription = {
    ...baseSub,
    tier: AccountTier.FAMILY,
    subscriptionStatus: "active",
    trialStatus: "converted",
    storePlatform: "android",
    storeProductId: "plantpal_family_monthly",
  };
  assert.ok(
    canAccessFeature(AccountTier.FAMILY, "family_sharing", { subscription: paid })
  );
  console.log("✓ Paid Family unlocks Family features");
}

function testBetaUnlockOffInProduction() {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  delete process.env.DEV_UNLOCK_ALL_FEATURES;
  delete process.env.NEXT_PUBLIC_DEV_UNLOCK_ALL_FEATURES;
  delete process.env.ALLOW_PROD_BETA_UNLOCK;
  assert.equal(PUBLIC_BETA_UNLOCK_ALL, false);
  assert.equal(isDevUnlockAllFeatures(), false);
  process.env.NODE_ENV = prev;
  console.log("✓ Dev unlock disabled in production");
}

function testLocalTrialAutoStartDisabled() {
  assert.equal(isLocalTrialAutoStartEnabled(), false);
  console.log("✓ Local trial auto-start disabled");
}

function testLoadVerifiedSubscriptionNeverAutoStarts() {
  const loaded = loadVerifiedSubscriptionState();
  assert.equal(loaded.subscriptionStatus, "mock");
  assert.equal(loaded.tier, AccountTier.FREE);
  console.log("✓ loadVerifiedSubscriptionState does not auto-start trial");
}

function testPaywallPrices() {
  const plans = buildPaywallPlans();
  assert.equal(plans.length, 4);
  const proMonthly = plans.find((p) => p.tier === AccountTier.PLUS && p.cycle === "monthly");
  assert.ok(proMonthly);
  assert.equal(proMonthly!.price, formatPrice(OFFICIAL_PRICING.pro.monthly));
  console.log("✓ Paywall renders configured prices");
}

function testStoreProductIds() {
  assert.equal(STORE_PRODUCTS.length, 4);
  assert.ok(STORE_PRODUCTS.some((p) => p.iosProductId === "com.getplantpal.pro.monthly"));
  console.log("✓ Store product IDs present");
}

function main() {
  console.log("=== PlantPal billing tests ===\n");
  testNewUserWithoutStoreTrialStaysFree();
  testVerifiedRevenueCatTrialUnlocksAccess();
  testClientOnlyLocalTrialBlockedInProduction();
  testExpiredVerifiedTrialLocksPro();
  testPaidProUnlocks();
  testPaidFamilyUnlocksFamily();
  testBetaUnlockOffInProduction();
  testLocalTrialAutoStartDisabled();
  testLoadVerifiedSubscriptionNeverAutoStarts();
  testPaywallPrices();
  testStoreProductIds();
  console.log("\nAll billing tests passed.");
}

main();
