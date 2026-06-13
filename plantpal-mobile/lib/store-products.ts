/** Store product IDs — keep in sync with src/lib/billing/store-products.ts */
export const STORE_PRODUCT_IDS = {
  ios: {
    proMonthly: "com.getplantpal.pro.monthly",
    proYearly: "com.getplantpal.pro.yearly",
    familyMonthly: "com.getplantpal.family.monthly",
    familyYearly: "com.getplantpal.family.yearly",
  },
  android: {
    proMonthly: "plantpal_pro_monthly",
    proYearly: "plantpal_pro_yearly",
    familyMonthly: "plantpal_family_monthly",
    familyYearly: "plantpal_family_yearly",
  },
} as const;

export const REVENUECAT_ENTITLEMENTS = {
  pro: "pro",
  family: "family",
} as const;

export function allKnownProductIds(): string[] {
  return [
    ...Object.values(STORE_PRODUCT_IDS.ios),
    ...Object.values(STORE_PRODUCT_IDS.android),
  ];
}
