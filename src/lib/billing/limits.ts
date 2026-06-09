import { AccountTier, type AccountTier as Tier } from "./tier-config";

export const FREE_PLANT_LIMIT = 25;

/** Free tier: plant ID scans per calendar month */
export const FREE_SCAN_LIMIT_MONTHLY = 20;

/** Academy paths included on Free (basics) */
export const FREE_ACADEMY_PATH_IDS = ["beginner-gardening"] as const;

/** Routes that require PlantPal Pro */
export const PRO_ONLY_ROUTE_PREFIXES = [
  "/landscape",
  "/landscape-designer",
  "/design-studio",
  "/seasonal",
  "/concierge",
] as const;

export const PRO_FEATURE_SEARCH_PARAM = "feature";

export function isProTier(tier: Tier): boolean {
  return tier === AccountTier.PLUS || tier === AccountTier.FAMILY;
}

export function getScanLimitForTier(tier: Tier): number | null {
  return isProTier(tier) ? null : FREE_SCAN_LIMIT_MONTHLY;
}

export function canAccessAcademyPath(tier: Tier, pathId: string): boolean {
  if (isProTier(tier)) return true;
  return (FREE_ACADEMY_PATH_IDS as readonly string[]).includes(pathId);
}

export function isProOnlyRoute(pathname: string): boolean {
  return PRO_ONLY_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
