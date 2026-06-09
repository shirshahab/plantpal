import type { NextRequest } from "next/server";
import { AccountTier, type AccountTier as Tier } from "./tier-config";
import {
  parseScanUsageFromCookieHeader,
  parseTierFromCookieHeader,
} from "./subscription-cookie";
import { isBetaUnlocked } from "./beta-unlock";
import { isProTier } from "./limits";

export interface ServerSubscriptionContext {
  tier: Tier;
  unrestricted: boolean;
  isPro: boolean;
  scanUsage: { month: string; scans: number } | null;
}

function resolveFromCookieHeader(
  cookieHeader: string | null,
  request?: NextRequest | Request
): ServerSubscriptionContext {
  const unrestricted = request ? isBetaUnlocked(request) : false;
  const cookieTier = parseTierFromCookieHeader(cookieHeader);
  const tier = cookieTier ?? AccountTier.FREE;

  return {
    tier,
    unrestricted,
    isPro: unrestricted || isProTier(tier),
    scanUsage: parseScanUsageFromCookieHeader(cookieHeader),
  };
}

export function resolveServerSubscription(request: NextRequest): ServerSubscriptionContext {
  return resolveFromCookieHeader(request.headers.get("cookie"), request);
}

export function resolveSubscriptionFromRequest(request: Request): ServerSubscriptionContext {
  return resolveFromCookieHeader(request.headers.get("cookie"), request);
}
