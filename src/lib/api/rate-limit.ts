/**
 * Lightweight in-memory rate limiting for API cost control.
 * Resets on server restart; sufficient for beta / single-instance deploys.
 */

import { isBetaUnlocked } from "@/lib/billing/beta-unlock";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  options?: { bypass?: boolean }
): RateLimitResult {
  if (options?.bypass || isBetaUnlocked()) {
    return { allowed: true, remaining: max, resetAt: Date.now() + windowMs };
  }

  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  if (bucket.count >= max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: max - bucket.count,
    resetAt: bucket.resetAt,
  };
}

export function dailyLimitKey(scope: string, userOrIp: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${scope}:${day}:${userOrIp}`;
}

export const RATE_LIMITS = {
  aiScanDaily: 25,
  priceSearchDaily: 15,
  priceSearchBurst: 5,
  priceSearchBurstWindowMs: 60_000,
  plantSearchBurst: 30,
  plantSearchBurstWindowMs: 60_000,
} as const;

export function getClientKey(request: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anon";
  return `ip:${ip}`;
}
