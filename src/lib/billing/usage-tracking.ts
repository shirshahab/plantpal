import { AccountTier } from "./tier-config";
import {
  FREE_SCAN_LIMIT_MONTHLY,
  getScanLimitForTier,
  isProTier,
} from "./limits";
import { isDevUnlockAllFeatures } from "./dev-unlock";
import { setScanUsageCookie } from "./subscription-cookie";

export const USAGE_STORAGE_KEY = "plantpal-usage";

export interface MonthlyUsage {
  month: string;
  scans: number;
}

export interface UsageSummary {
  month: string;
  scansUsed: number;
  scanLimit: number | null;
  scansRemaining: number | null;
  plantLimit: number | null;
  plantsUsed: number;
  plantsRemaining: number | null;
  tier: AccountTier;
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function loadRawUsage(): MonthlyUsage {
  if (typeof window === "undefined") {
    return { month: currentMonthKey(), scans: 0 };
  }
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return { month: currentMonthKey(), scans: 0 };
    const parsed = JSON.parse(raw) as MonthlyUsage;
    if (parsed.month !== currentMonthKey()) {
      return { month: currentMonthKey(), scans: 0 };
    }
    return { month: parsed.month, scans: parsed.scans ?? 0 };
  } catch {
    return { month: currentMonthKey(), scans: 0 };
  }
}

function persistUsage(usage: MonthlyUsage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  setScanUsageCookie(usage.month, usage.scans);
}

export function getMonthlyScanUsage(): MonthlyUsage {
  return loadRawUsage();
}

export function recordScanUsage(): MonthlyUsage {
  const usage = loadRawUsage();
  usage.scans += 1;
  persistUsage(usage);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("plantpal-scan-usage-updated"));
  }
  return usage;
}

export function canUseScan(tier: AccountTier, unrestricted = false): boolean {
  if (isDevUnlockAllFeatures() || unrestricted || isProTier(tier)) return true;
  const usage = getMonthlyScanUsage();
  return usage.scans < FREE_SCAN_LIMIT_MONTHLY;
}

export function scansRemaining(tier: AccountTier, unrestricted = false): number | null {
  if (isDevUnlockAllFeatures() || unrestricted || isProTier(tier)) return null;
  const usage = getMonthlyScanUsage();
  return Math.max(0, FREE_SCAN_LIMIT_MONTHLY - usage.scans);
}

export function buildUsageSummary(
  tier: AccountTier,
  plantsUsed: number,
  plantLimit: number | null,
  unrestricted = false
): UsageSummary {
  const usage = getMonthlyScanUsage();
  const scanLimit = unrestricted ? null : getScanLimitForTier(tier);
  const remaining = scansRemaining(tier, unrestricted);

  return {
    month: usage.month,
    scansUsed: usage.scans,
    scanLimit,
    scansRemaining: remaining,
    plantLimit: unrestricted ? null : plantLimit,
    plantsUsed,
    plantsRemaining:
      plantLimit === null || unrestricted
        ? null
        : Math.max(0, plantLimit - plantsUsed),
    tier,
  };
}

/** Server-side scan check from cookie-carried usage snapshot. */
export function serverCanScan(
  tier: AccountTier,
  usage: { month: string; scans: number } | null,
  unrestricted = false
): { allowed: boolean; remaining: number | null } {
  if (isDevUnlockAllFeatures() || unrestricted || isProTier(tier)) {
    return { allowed: true, remaining: null };
  }

  const month = currentMonthKey();
  const scans = usage?.month === month ? usage.scans : 0;
  const remaining = Math.max(0, FREE_SCAN_LIMIT_MONTHLY - scans);
  return { allowed: scans < FREE_SCAN_LIMIT_MONTHLY, remaining };
}

export function serverIncrementScanUsage(
  usage: { month: string; scans: number } | null
): { month: string; scans: number } {
  const month = currentMonthKey();
  const scans = (usage?.month === month ? usage.scans : 0) + 1;
  return { month, scans };
}
