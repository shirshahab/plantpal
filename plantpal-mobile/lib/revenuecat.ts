import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";
import { allKnownProductIds, REVENUECAT_ENTITLEMENTS } from "./store-products";
import { purchaseLog } from "./purchase-logger";

export type StorePlatform = "ios" | "android";

export interface PurchaseCustomerInfo {
  activeEntitlements: string[];
  activeProductIds: string[];
  originalTransactionId?: string | null;
  purchaseToken?: string | null;
  expirationDate?: string | null;
  isTrialing?: boolean;
  storePlatform?: StorePlatform;
}

export interface NativePurchaseResult {
  ok: boolean;
  customerInfo?: PurchaseCustomerInfo;
  error?: string;
}

export interface StoreProductPrice {
  productId: string;
  title: string;
  priceString: string;
  currencyCode?: string;
}

let configured = false;

function getPlatform(): StorePlatform | null {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return null;
}

export function getRevenueCatApiKey(): string | null {
  const platform = getPlatform();
  if (platform === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || null;
  }
  if (platform === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || null;
  }
  return null;
}

export function isRevenueCatConfigured(): boolean {
  return configured && Boolean(getRevenueCatApiKey());
}

export async function configureRevenueCat(appUserId?: string | null): Promise<boolean> {
  const platform = getPlatform();
  if (!platform) return false;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    purchaseLog("revenuecat_key_missing", { platform });
    return false;
  }

  if (!configured) {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    await Purchases.configure({
      apiKey,
      appUserID: appUserId ?? undefined,
    });
    configured = true;
    purchaseLog("revenuecat_configured", { platform, hasUser: Boolean(appUserId) });
  } else if (appUserId) {
    await Purchases.logIn(appUserId);
    purchaseLog("revenuecat_login", { userIdPrefix: appUserId.slice(0, 8) });
  }

  return true;
}

export async function loginRevenueCat(appUserId: string): Promise<void> {
  await configureRevenueCat(appUserId);
  if (configured) {
    await Purchases.logIn(appUserId);
    purchaseLog("revenuecat_user_linked");
  }
}

function mapCustomerInfo(info: CustomerInfo, platform: StorePlatform): PurchaseCustomerInfo {
  const activeEntries = Object.entries(info.entitlements.active);
  const activeEntitlements = activeEntries.map(([id]) => id);
  const activeProductIds = activeEntries
    .map(([, ent]) => ent.productIdentifier)
    .filter(Boolean);

  const primary = activeEntries[0]?.[1];
  const isTrialing =
    primary?.periodType === "TRIAL" || primary?.periodType === "INTRO";

  return {
    activeEntitlements,
    activeProductIds,
    originalTransactionId: null,
    purchaseToken: null,
    expirationDate: primary?.expirationDate ?? null,
    isTrialing,
    storePlatform: platform,
  };
}

function findPackageForProductId(
  offerings: PurchasesOfferings,
  productId: string
): PurchasesPackage | null {
  const search = (packages: PurchasesPackage[]) =>
    packages.find((pkg) => pkg.product.identifier === productId) ?? null;

  if (offerings.current?.availablePackages?.length) {
    const match = search(offerings.current.availablePackages);
    if (match) return match;
  }

  for (const offering of Object.values(offerings.all)) {
    const match = search(offering.availablePackages);
    if (match) return match;
  }

  return null;
}

export async function loadStoreProducts(): Promise<StoreProductPrice[]> {
  if (!(await configureRevenueCat())) return [];

  const offerings = await Purchases.getOfferings();
  purchaseLog("offerings_loaded", {
    current: offerings.current?.identifier ?? null,
    packageCount: offerings.current?.availablePackages.length ?? 0,
  });

  const packages = offerings.current?.availablePackages ?? [];
  const known = new Set(allKnownProductIds());

  return packages
    .filter((pkg) => known.has(pkg.product.identifier))
    .map((pkg) => ({
      productId: pkg.product.identifier,
      title: pkg.product.title,
      priceString: pkg.product.priceString,
      currencyCode: pkg.product.currencyCode,
    }));
}

export async function purchaseProduct(productId: string): Promise<NativePurchaseResult> {
  const platform = getPlatform();
  if (!platform) {
    return { ok: false, error: "Purchases not supported on this platform" };
  }

  if (!(await configureRevenueCat())) {
    return { ok: false, error: "RevenueCat is not configured" };
  }

  purchaseLog("purchase_started", { productId });

  try {
    const offerings = await Purchases.getOfferings();
    const pkg = findPackageForProductId(offerings, productId);
    if (!pkg) {
      purchaseLog("package_not_found", { productId });
      return { ok: false, error: "Product not found in RevenueCat offerings" };
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const mapped = mapCustomerInfo(customerInfo, platform);
    const hasEntitlement =
      mapped.activeEntitlements.includes(REVENUECAT_ENTITLEMENTS.pro) ||
      mapped.activeEntitlements.includes(REVENUECAT_ENTITLEMENTS.family);

    purchaseLog("purchase_completed", {
      productId,
      entitlements: mapped.activeEntitlements,
      hasEntitlement,
    });

    if (!hasEntitlement) {
      return { ok: false, error: "Purchase did not activate a subscription" };
    }

    return { ok: true, customerInfo: mapped };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      purchaseLog("purchase_cancelled", { productId });
      return { ok: false, error: "Purchase canceled or failed" };
    }
    const message = err instanceof Error ? err.message : "Purchase canceled or failed";
    purchaseLog("purchase_failed", { productId, message });
    return { ok: false, error: message };
  }
}

export async function restorePurchasesNative(): Promise<NativePurchaseResult> {
  const platform = getPlatform();
  if (!platform) {
    return { ok: false, error: "Purchases not supported on this platform" };
  }

  if (!(await configureRevenueCat())) {
    return { ok: false, error: "RevenueCat is not configured" };
  }

  purchaseLog("restore_started");

  try {
    const customerInfo = await Purchases.restorePurchases();
    const mapped = mapCustomerInfo(customerInfo, platform);
    const hasEntitlement =
      mapped.activeEntitlements.includes(REVENUECAT_ENTITLEMENTS.pro) ||
      mapped.activeEntitlements.includes(REVENUECAT_ENTITLEMENTS.family);

    purchaseLog("restore_completed", {
      entitlements: mapped.activeEntitlements,
      hasEntitlement,
    });

    if (!hasEntitlement) {
      return { ok: false, error: "No active subscription found to restore" };
    }

    return { ok: true, customerInfo: mapped };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Restore failed";
    purchaseLog("restore_failed", { message });
    return { ok: false, error: message };
  }
}

export async function getCurrentEntitlementNative(): Promise<PurchaseCustomerInfo | null> {
  const platform = getPlatform();
  if (!platform || !(await configureRevenueCat())) return null;

  try {
    const info = await Purchases.getCustomerInfo();
    const mapped = mapCustomerInfo(info, platform);
    const hasEntitlement =
      mapped.activeEntitlements.includes(REVENUECAT_ENTITLEMENTS.pro) ||
      mapped.activeEntitlements.includes(REVENUECAT_ENTITLEMENTS.family);

    if (hasEntitlement) {
      purchaseLog("entitlement_detected", { entitlements: mapped.activeEntitlements });
    }

    return hasEntitlement ? mapped : null;
  } catch {
    return null;
  }
}
