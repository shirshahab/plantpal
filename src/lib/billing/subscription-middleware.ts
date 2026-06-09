import { NextResponse, type NextRequest } from "next/server";
import { AccountTier } from "./tier-config";
import { isProOnlyRoute, isProTier, PRO_FEATURE_SEARCH_PARAM } from "./limits";
import {
  parseTierFromCookieHeader,
  SUBSCRIPTION_TIER_COOKIE,
} from "./subscription-cookie";
import { isBetaUnlocked } from "./beta-unlock";

const BYPASS_PREFIXES = ["/upgrade", "/billing", "/settings", "/login", "/onboarding"];

function shouldBypassSubscriptionGate(pathname: string): boolean {
  return BYPASS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * Gate Pro-only app routes. Free users are redirected to /upgrade with context.
 * Sets x-plantpal-tier response header for downstream use.
 */
export function applySubscriptionMiddleware(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const pathname = request.nextUrl.pathname;

  if (shouldBypassSubscriptionGate(pathname)) {
    return response;
  }

  const unrestricted = isBetaUnlocked(request);
  const cookieTier = parseTierFromCookieHeader(request.headers.get("cookie"));
  const tier = cookieTier ?? AccountTier.FREE;

  response.headers.set("x-plantpal-tier", tier);

  if (unrestricted || !isProOnlyRoute(pathname)) {
    return response;
  }

  if (isProTier(tier)) {
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/upgrade";
  url.searchParams.set(PRO_FEATURE_SEARCH_PARAM, pathname.replace(/^\//, ""));
  return NextResponse.redirect(url);
}

/** Ensure anonymous visitors have a default tier cookie for API routes. */
export function ensureSubscriptionCookie(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (!cookieHeader.includes(`${SUBSCRIPTION_TIER_COOKIE}=`)) {
    response.cookies.set(SUBSCRIPTION_TIER_COOKIE, AccountTier.FREE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
      sameSite: "lax",
    });
  }
  return response;
}
