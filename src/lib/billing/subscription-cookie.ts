import type { AccountTier } from "./tier-config";

export const SUBSCRIPTION_TIER_COOKIE = "plantpal-tier";
export const SUBSCRIPTION_USAGE_COOKIE = "plantpal-scan-usage";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~400 days

export function setSubscriptionTierCookie(tier: AccountTier): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SUBSCRIPTION_TIER_COOKIE}=${tier}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function setScanUsageCookie(monthKey: string, count: number): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify({ month: monthKey, scans: count }));
  document.cookie = `${SUBSCRIPTION_USAGE_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function parseTierFromCookieHeader(cookieHeader: string | null): AccountTier | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SUBSCRIPTION_TIER_COOKIE}=([^;]+)`)
  );
  const value = match?.[1];
  if (value === "free" || value === "plus" || value === "family") return value;
  return null;
}

export function parseScanUsageFromCookieHeader(
  cookieHeader: string | null
): { month: string; scans: number } | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SUBSCRIPTION_USAGE_COOKIE}=([^;]+)`)
  );
  if (!match?.[1]) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as { month?: string; scans?: number };
    if (typeof parsed.month === "string" && typeof parsed.scans === "number") {
      return { month: parsed.month, scans: parsed.scans };
    }
  } catch {
    /* ignore */
  }
  return null;
}
