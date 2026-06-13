/**
 * RevenueCat integration layer (native bridge + server verification).
 * Public SDK keys belong in the native Expo app only — never Apple/Google secrets here.
 */
import { AccountTier } from "./tier-config";
import {
  mapProductIdToEntitlement,
  subscriptionStatusFromStore,
  tierFromRevenueCatEntitlements,
  trialStatusFromStore,
} from "./entitlements";
import {
  getNativePurchasesBridge,
  type PurchaseCustomerInfo,
  type NativePurchaseResult,
  type StoreProductPrice,
  type SubscriptionPatchFromStore,
} from "./native-bridge";
import { STORE_PRODUCTS, getStoreProductId, type StorePlatform } from "./store-products";
import type { UserSubscription } from "@/lib/types/billing";

export interface RevenueCatOfferingPackage {
  identifier: string;
  productId: string;
  priceString: string;
}

export interface RevenueCatOfferings {
  currentOfferingId: string | null;
  packages: RevenueCatOfferingPackage[];
}

export interface RevenueCatSubscriberEntitlement {
  expires_date: string | null;
  product_identifier?: string;
  purchase_date?: string;
  period_type?: string;
}

export interface RevenueCatSubscriberPayload {
  subscriber: {
    entitlements: Record<string, RevenueCatSubscriberEntitlement>;
    subscriptions: Record<
      string,
      {
        expires_date: string | null;
        purchase_date?: string;
        period_type?: string;
        store?: string;
        original_transaction_id?: string;
        store_transaction_id?: string;
      }
    >;
  };
}

function getPublicRevenueCatKey(platform: StorePlatform): string | null {
  if (platform === "ios") {
    return process.env.NEXT_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || null;
  }
  if (platform === "android") {
    return process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || null;
  }
  return null;
}

export function isRevenueCatConfigured(platform: StorePlatform): boolean {
  if (getNativePurchasesBridge()?.isConfigured?.()) return true;
  return Boolean(getPublicRevenueCatKey(platform));
}

export function getRevenueCatServerApiKey(): string | null {
  return process.env.REVENUECAT_API_KEY?.trim() || null;
}

export async function configureRevenueCat(userId: string): Promise<boolean> {
  const bridge = getNativePurchasesBridge();
  if (!bridge) return false;
  try {
    if (bridge.configure) {
      await bridge.configure(userId);
    }
    return true;
  } catch {
    return false;
  }
}

export async function getOfferings(platform: StorePlatform): Promise<RevenueCatOfferings> {
  const bridge = getNativePurchasesBridge();
  if (bridge) {
    try {
      const products = await bridge.loadProducts();
      return {
        currentOfferingId: "native",
        packages: products.map((p) => ({
          identifier: p.productId,
          productId: p.productId,
          priceString: p.priceString,
        })),
      };
    } catch {
      return { currentOfferingId: null, packages: [] };
    }
  }

  if (!isRevenueCatConfigured(platform)) {
    return { currentOfferingId: null, packages: [] };
  }

  return {
    currentOfferingId: "configured",
    packages: STORE_PRODUCTS.map((p) => ({
      identifier: `${p.tier}-${p.cycle}`,
      productId:
        platform === "ios"
          ? p.iosProductId
          : platform === "android"
            ? p.androidProductId
            : p.iosProductId,
      priceString: p.label,
    })),
  };
}

export async function purchasePackage(
  productId: string,
  platform: StorePlatform
): Promise<NativePurchaseResult> {
  const bridge = getNativePurchasesBridge();
  if (!bridge) {
    return {
      ok: false,
      error: "Native purchase bridge not available. Install RevenueCat in the mobile app.",
    };
  }

  const expectedId = STORE_PRODUCTS.some(
    (p) => p.iosProductId === productId || p.androidProductId === productId
  );
  if (!expectedId) {
    return { ok: false, error: "Unknown product ID" };
  }

  if (!getPublicRevenueCatKey(platform) && !bridge.isConfigured?.()) {
    return { ok: false, error: "RevenueCat is not configured for this platform" };
  }

  try {
    const purchaseFn = bridge.purchaseProduct ?? bridge.purchase;
    if (!purchaseFn) {
      return { ok: false, error: "Purchase method not available on native bridge" };
    }
    return await purchaseFn.call(bridge, productId);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Purchase failed",
    };
  }
}

export async function restorePurchases(): Promise<NativePurchaseResult> {
  const bridge = getNativePurchasesBridge();
  if (!bridge) {
    return { ok: false, error: "Native purchase bridge not available" };
  }
  try {
    const restoreFn = bridge.restorePurchases ?? bridge.restore;
    if (!restoreFn) {
      return { ok: false, error: "Restore method not available on native bridge" };
    }
    return await restoreFn.call(bridge);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Restore failed",
    };
  }
}

export function mapCustomerInfoToSubscriptionState(
  info: PurchaseCustomerInfo
): SubscriptionPatchFromStore | null {
  const tierFromEntitlements = tierFromRevenueCatEntitlements(info.activeEntitlements);
  let tier = tierFromEntitlements;
  let cycle: UserSubscription["billingCycle"] = "monthly";
  let productId = info.activeProductIds[0] ?? null;

  if (productId) {
    const mapped = mapProductIdToEntitlement(productId);
    if (mapped) {
      tier = mapped.tier;
      cycle = mapped.cycle;
    }
  }

  if (!tier) return null;

  const isTrialing = Boolean(info.isTrialing);
  const isActive = info.activeEntitlements.length > 0 || info.activeProductIds.length > 0;

  return {
    tier,
    billingCycle: cycle,
    subscriptionStatus: subscriptionStatusFromStore(isActive, isTrialing),
    trialStatus: trialStatusFromStore(isTrialing, true),
    planStartDate: new Date().toISOString(),
    planEndDate: info.expirationDate ?? null,
    trialEndsAt: isTrialing ? info.expirationDate ?? null : null,
    storePlatform: info.storePlatform ?? null,
    storeProductId: productId,
    storeOriginalTransactionId: info.originalTransactionId ?? null,
    storePurchaseToken: info.purchaseToken ?? null,
  };
}

export function mapRevenueCatSubscriberToSubscriptionState(
  payload: RevenueCatSubscriberPayload
): SubscriptionPatchFromStore | null {
  const entitlements = payload.subscriber.entitlements ?? {};
  const activeEntitlementIds = Object.entries(entitlements)
    .filter(([, e]) => !e.expires_date || new Date(e.expires_date).getTime() > Date.now())
    .map(([id]) => id);

  const subscriptions = payload.subscriber.subscriptions ?? {};
  const activeProductIds = Object.entries(subscriptions)
    .filter(([, s]) => !s.expires_date || new Date(s.expires_date).getTime() > Date.now())
    .map(([id]) => id);

  const primaryProduct = activeProductIds[0] ?? null;
  const subEntry = primaryProduct ? subscriptions[primaryProduct] : undefined;
  const isTrialing = subEntry?.period_type === "trial" || subEntry?.period_type === "intro";

  const storePlatform: StorePlatform | null =
    subEntry?.store === "app_store"
      ? "ios"
      : subEntry?.store === "play_store"
        ? "android"
        : null;

  return mapCustomerInfoToSubscriptionState({
    activeEntitlements: activeEntitlementIds,
    activeProductIds,
    originalTransactionId: subEntry?.original_transaction_id ?? null,
    purchaseToken: subEntry?.store_transaction_id ?? null,
    expirationDate: subEntry?.expires_date ?? null,
    isTrialing,
    storePlatform: storePlatform ?? undefined,
  });
}

export async function fetchRevenueCatSubscriber(
  appUserId: string
): Promise<RevenueCatSubscriberPayload | null> {
  const apiKey = getRevenueCatServerApiKey();
  if (!apiKey) return null;

  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;
  return (await res.json()) as RevenueCatSubscriberPayload;
}

export function resolveProductIdForTier(
  tier: typeof AccountTier.PLUS | typeof AccountTier.FAMILY,
  cycle: UserSubscription["billingCycle"],
  platform: StorePlatform
): string | null {
  return getStoreProductId(tier, cycle, platform);
}

export type { StoreProductPrice, NativePurchaseResult, PurchaseCustomerInfo };
