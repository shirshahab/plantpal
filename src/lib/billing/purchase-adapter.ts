/**
 * Unified purchase adapter for web preview, iOS, and Android.
 * Web/PWA does not grant paid access without verified store billing.
 */
import { AccountTier } from "./tier-config";
import {
  configureRevenueCat,
  getOfferings,
  isRevenueCatConfigured,
  mapCustomerInfoToSubscriptionState,
  purchasePackage,
  restorePurchases,
  resolveProductIdForTier,
  type NativePurchaseResult,
  type RevenueCatOfferings,
} from "./revenuecat";
import {
  detectCapacitorPlatform,
  detectWebViewPlatform,
  getNativePurchasesBridge,
  type SubscriptionPatchFromStore,
} from "./native-bridge";
import { STORE_PRODUCTS, type StorePlatform } from "./store-products";
import type { BillingCycle, UserSubscription } from "@/lib/types/billing";
import { isMockPurchaseAllowed as isMockPurchaseAllowedFromState } from "./subscription-state";

export type PurchasePlatform = "web" | "ios" | "android" | "unknown";

export interface PurchaseAdapterProduct {
  productId: string;
  tier: typeof AccountTier.PLUS | typeof AccountTier.FAMILY;
  cycle: BillingCycle;
  label: string;
  priceString?: string;
}

export interface PurchaseStartResult {
  ok: boolean;
  error?: string;
  unavailableReason?: string;
  subscription?: SubscriptionPatchFromStore;
}

export interface PurchaseEntitlement {
  tier: UserSubscription["tier"];
  billingCycle: BillingCycle;
  subscriptionStatus: UserSubscription["subscriptionStatus"];
  trialStatus: UserSubscription["trialStatus"];
  planEndDate: string | null;
  storePlatform: StorePlatform | null;
  storeProductId: string | null;
}

const WEB_UNAVAILABLE =
  "Store billing unavailable in web preview. Subscribe in the PlantPal iOS or Android app.";

export function getPurchasePlatform(): PurchasePlatform {
  if (typeof window === "undefined") return "unknown";

  const bridge = getNativePurchasesBridge();
  if (bridge?.platform === "ios") return "ios";
  if (bridge?.platform === "android") return "android";

  const cap = detectCapacitorPlatform();
  if (cap) return cap;

  const webView = detectWebViewPlatform();
  if (webView) return webView;

  return "web";
}

export function isPurchaseConfigured(): boolean {
  const platform = getPurchasePlatform();
  if (platform === "ios" || platform === "android") {
    const bridge = getNativePurchasesBridge();
    if (bridge?.isConfigured?.()) return true;
    return isRevenueCatConfigured(platform);
  }
  return false;
}

export function isMockPurchaseAllowed(): boolean {
  return isMockPurchaseAllowedFromState();
}

export async function loadStoreProducts(): Promise<PurchaseAdapterProduct[]> {
  const platform = getPurchasePlatform();
  if (platform === "web" || platform === "unknown") {
    return STORE_PRODUCTS.map((p) => ({
      productId: p.iosProductId,
      tier: p.tier,
      cycle: p.cycle,
      label: p.label,
    }));
  }

  const storePlatform = platform as StorePlatform;
  const offerings: RevenueCatOfferings = await getOfferings(storePlatform);
  const priceById = new Map(offerings.packages.map((p) => [p.productId, p.priceString]));

  return STORE_PRODUCTS.map((p) => {
    const productId =
      storePlatform === "ios" ? p.iosProductId : p.androidProductId;
    return {
      productId,
      tier: p.tier,
      cycle: p.cycle,
      label: p.label,
      priceString: priceById.get(productId),
    };
  });
}

async function syncSubscriptionToServer(): Promise<void> {
  try {
    await fetch("/api/billing/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "client" }),
    });
  } catch {
    /* server sync is best-effort; webhook is authoritative */
  }
}

function resultFromNativePurchase(result: NativePurchaseResult): PurchaseStartResult {
  if (!result.ok || !result.customerInfo) {
    return {
      ok: false,
      error: result.error ?? "Purchase did not go through. Your plants are still innocent. Try again.",
    };
  }

  const subscription = mapCustomerInfoToSubscriptionState(result.customerInfo);
  if (!subscription) {
    return {
      ok: false,
      error: "Purchase did not go through. Your plants are still innocent. Try again.",
    };
  }

  return { ok: true, subscription };
}

export async function startPurchase(
  productId: string,
  userId?: string | null
): Promise<PurchaseStartResult> {
  const platform = getPurchasePlatform();

  if (platform === "web" || platform === "unknown") {
    return { ok: false, unavailableReason: WEB_UNAVAILABLE };
  }

  if (userId) {
    await configureRevenueCat(userId);
  }

  const storePlatform = platform as StorePlatform;
  const purchaseResult = await purchasePackage(productId, storePlatform);
  const mapped = resultFromNativePurchase(purchaseResult);

  if (mapped.ok) {
    await syncSubscriptionToServer();
  }

  return mapped;
}

export async function startPurchaseForTier(
  tier: typeof AccountTier.PLUS | typeof AccountTier.FAMILY,
  cycle: BillingCycle,
  userId?: string | null
): Promise<PurchaseStartResult> {
  const platform = getPurchasePlatform();
  if (platform === "web" || platform === "unknown") {
    return { ok: false, unavailableReason: WEB_UNAVAILABLE };
  }

  const productId = resolveProductIdForTier(tier, cycle, platform as StorePlatform);
  if (!productId) {
    return { ok: false, error: "Product not found for this plan" };
  }

  return startPurchase(productId, userId);
}

export async function restorePurchasesFlow(userId?: string | null): Promise<PurchaseStartResult> {
  const platform = getPurchasePlatform();

  if (platform === "web" || platform === "unknown") {
    return { ok: false, unavailableReason: WEB_UNAVAILABLE };
  }

  if (userId) {
    await configureRevenueCat(userId);
  }

  const restoreResult = await restorePurchases();
  const mapped = resultFromNativePurchase(restoreResult);

  if (mapped.ok) {
    await syncSubscriptionToServer();
  } else if (!restoreResult.ok) {
    return {
      ok: false,
      error: restoreResult.error ?? "No active subscription found to restore.",
    };
  }

  return mapped;
}

export async function getCurrentEntitlement(): Promise<PurchaseEntitlement | null> {
  const platform = getPurchasePlatform();
  if (platform === "web" || platform === "unknown") return null;

  const bridge = getNativePurchasesBridge();
  if (!bridge) return null;

  try {
    const getEntitlement = bridge.getCurrentEntitlement ?? bridge.getCustomerInfo;
    const info = getEntitlement ? await getEntitlement.call(bridge) : null;
    if (!info) return null;
    const patch = mapCustomerInfoToSubscriptionState(info);
    if (!patch) return null;

    return {
      tier: patch.tier,
      billingCycle: patch.billingCycle,
      subscriptionStatus: patch.subscriptionStatus,
      trialStatus: patch.trialStatus,
      planEndDate: patch.planEndDate ?? null,
      storePlatform: patch.storePlatform ?? null,
      storeProductId: patch.storeProductId ?? null,
    };
  } catch {
    return null;
  }
}

export function getWebPurchaseUnavailableMessage(): string {
  return WEB_UNAVAILABLE;
}

export { WEB_UNAVAILABLE as PURCHASE_WEB_UNAVAILABLE_MESSAGE };
