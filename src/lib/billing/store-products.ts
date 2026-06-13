/**
 * App Store and Google Play subscription product IDs.
 * Configure matching products in App Store Connect and Play Console.
 */
import { AccountTier } from "./tier-config";
import type { BillingCycle } from "@/lib/types/billing";

export type StorePlatform = "ios" | "android" | "web";

export interface StoreProduct {
  tier: typeof AccountTier.PLUS | typeof AccountTier.FAMILY;
  cycle: BillingCycle;
  iosProductId: string;
  androidProductId: string;
  label: string;
}

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    tier: AccountTier.PLUS,
    cycle: "monthly",
    iosProductId: "com.getplantpal.pro.monthly",
    androidProductId: "plantpal_pro_monthly",
    label: "PlantPal Pro Monthly",
  },
  {
    tier: AccountTier.PLUS,
    cycle: "annual",
    iosProductId: "com.getplantpal.pro.yearly",
    androidProductId: "plantpal_pro_yearly",
    label: "PlantPal Pro Yearly",
  },
  {
    tier: AccountTier.FAMILY,
    cycle: "monthly",
    iosProductId: "com.getplantpal.family.monthly",
    androidProductId: "plantpal_family_monthly",
    label: "PlantPal Pro Family Monthly",
  },
  {
    tier: AccountTier.FAMILY,
    cycle: "annual",
    iosProductId: "com.getplantpal.family.yearly",
    androidProductId: "plantpal_family_yearly",
    label: "PlantPal Pro Family Yearly",
  },
];

export function getStoreProductId(
  tier: typeof AccountTier.PLUS | typeof AccountTier.FAMILY,
  cycle: BillingCycle,
  platform: StorePlatform
): string | null {
  const row = STORE_PRODUCTS.find((p) => p.tier === tier && p.cycle === cycle);
  if (!row) return null;
  if (platform === "ios") return row.iosProductId;
  if (platform === "android") return row.androidProductId;
  return null;
}

export function findProductByStoreId(productId: string): StoreProduct | undefined {
  return STORE_PRODUCTS.find(
    (p) => p.iosProductId === productId || p.androidProductId === productId
  );
}
