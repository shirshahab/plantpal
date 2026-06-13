/**
 * Purchase configuration tests for App Store / Play Store launch.
 * Usage: npm run test:purchases
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { STORE_PRODUCTS } from "../src/lib/billing/store-products";
import { isMockPurchaseAllowed } from "../src/lib/billing/subscription-state";
import { verifyRevenueCatWebhookAuthorization } from "../src/lib/billing/revenuecat-webhook";

const ROOT = path.resolve(__dirname, "..");

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function testProductIdsDefined() {
  assert.equal(STORE_PRODUCTS.length, 4);
  for (const p of STORE_PRODUCTS) {
    assert.ok(p.iosProductId.startsWith("com.getplantpal."));
    assert.ok(p.androidProductId.startsWith("plantpal_"));
  }
  console.log("✓ Store product IDs defined");
}

function testPurchaseAdapterExists() {
  const src = readFile("src/lib/billing/purchase-adapter.ts");
  assert.match(src, /export function getPurchasePlatform/);
  assert.match(src, /export async function loadStoreProducts/);
  assert.match(src, /export async function startPurchase/);
  assert.match(src, /export async function restorePurchasesFlow/);
  assert.match(src, /export async function getCurrentEntitlement/);
  assert.match(src, /export function isPurchaseConfigured/);
  console.log("✓ Purchase adapter exports required functions");
}

function testProductionMockDisabled() {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  assert.equal(isMockPurchaseAllowed(), false);
  process.env.NODE_ENV = original;
  console.log("✓ Mock purchase disabled when NODE_ENV=production");
}

function testWebhookSecretCheck() {
  const original = process.env.REVENUECAT_WEBHOOK_SECRET;
  process.env.REVENUECAT_WEBHOOK_SECRET = "test-secret";
  assert.equal(verifyRevenueCatWebhookAuthorization("test-secret"), true);
  assert.equal(verifyRevenueCatWebhookAuthorization("wrong"), false);
  process.env.REVENUECAT_WEBHOOK_SECRET = original;
  console.log("✓ RevenueCat webhook secret verification exists");
}

function testBillingSyncRouteExists() {
  const routePath = path.join(ROOT, "src/app/api/billing/sync/route.ts");
  assert.ok(fs.existsSync(routePath));
  const src = fs.readFileSync(routePath, "utf8");
  assert.match(src, /upsertUserSubscription|fetchRevenueCatSubscriber/);
  console.log("✓ Billing sync route exists");
}

function testWebhookRouteExists() {
  const routePath = path.join(ROOT, "src/app/api/webhooks/revenuecat/route.ts");
  assert.ok(fs.existsSync(routePath));
  const src = fs.readFileSync(routePath, "utf8");
  assert.match(src, /verifyRevenueCatWebhookAuthorization/);
  console.log("✓ RevenueCat webhook route exists");
}

function testRestorePurchaseExists() {
  const paywall = readFile("src/components/billing/paywall.tsx");
  assert.match(paywall, /restorePurchasesFlow/);
  assert.match(paywall, /Restore purchase/);
  console.log("✓ Restore purchase wired in paywall");
}

function testPaywallNoProductionMock() {
  const paywall = readFile("src/components/billing/paywall.tsx");
  assert.match(paywall, /isMockPurchaseAllowed/);
  assert.doesNotMatch(paywall, /setTier\(tier, cycle\);\s*\/\/ Native IAP/);
  console.log("✓ Paywall gates mock purchase in production");
}

function testMobileBridgePresent() {
  const mobilePkg = path.join(ROOT, "plantpal-mobile/package.json");
  assert.ok(fs.existsSync(mobilePkg));
  const pkg = JSON.parse(fs.readFileSync(mobilePkg, "utf8")) as {
    dependencies?: Record<string, string>;
  };
  assert.ok(pkg.dependencies?.["react-native-purchases"]);
  assert.ok(pkg.dependencies?.["react-native-webview"]);

  const bridge = readFile("plantpal-mobile/lib/purchase-bridge-script.ts");
  assert.match(bridge, /window\.PlantPalPurchases/);
  assert.match(bridge, /purchaseProduct/);
  assert.match(bridge, /restorePurchases/);
  assert.match(bridge, /PLANTPAL_PURCHASE_REQUEST/);

  const webView = path.join(ROOT, "plantpal-mobile/components/PlantPalWebView.tsx");
  assert.ok(fs.existsSync(webView));
  console.log("✓ Expo mobile RevenueCat bridge present");
}

function main() {
  testProductIdsDefined();
  testPurchaseAdapterExists();
  testProductionMockDisabled();
  testWebhookSecretCheck();
  testBillingSyncRouteExists();
  testWebhookRouteExists();
  testRestorePurchaseExists();
  testPaywallNoProductionMock();
  testMobileBridgePresent();
  console.log("\nAll purchase config tests passed.");
}

main();
