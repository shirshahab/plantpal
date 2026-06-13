/**
 * Billing and trial tests for App Store launch.
 * Usage: npm run test:billing
 */
import assert from "node:assert/strict";
import { AccountTier } from "../src/lib/billing/tier-config";
import {
  grantLaunchTrial,
  getEffectiveTier,
  expireLaunchTrial,
  isTrialActive,
  LAUNCH_TRIAL_DAYS,
} from "../src/lib/billing/trial";
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

function testLaunchTrialGrantsAccess() {
  const trialing = grantLaunchTrial(baseSub, "launch");
  assert.equal(trialing.trialStatus, "active");
  assert.equal(LAUNCH_TRIAL_DAYS, 14);
  assert.ok(isTrialActive(trialing));
  assert.equal(getEffectiveTier(trialing), AccountTier.FAMILY);
  assert.ok(
    canAccessFeature(AccountTier.FREE, "ai_doctor", { subscription: trialing })
  );
  console.log("✓ Launch trial grants full access");
}

function testExpiredTrialLocksPro() {
  const expired = expireLaunchTrial(
    grantLaunchTrial({
      ...baseSub,
      trialStartedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      trialEndsAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      trialStatus: "active",
      planEndDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    })
  );
  assert.equal(expired.trialStatus, "expired");
  assert.equal(getEffectiveTier(expired), AccountTier.FREE);
  assert.equal(
    canAccessFeature(AccountTier.FREE, "ai_doctor", { subscription: expired }),
    false
  );
  console.log("✓ Expired trial locks Pro features");
}

function testPaidProUnlocks() {
  const paid: UserSubscription = {
    ...baseSub,
    tier: AccountTier.PLUS,
    subscriptionStatus: "active",
    trialStatus: "converted",
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
  testLaunchTrialGrantsAccess();
  testExpiredTrialLocksPro();
  testPaidProUnlocks();
  testPaidFamilyUnlocksFamily();
  testBetaUnlockOffInProduction();
  testPaywallPrices();
  testStoreProductIds();
  console.log("\nAll billing tests passed.");
}

main();
