/**
 * RevenueCat webhook event processing.
 */
import {
  mapProductIdToEntitlement,
  subscriptionStatusFromStore,
  tierFromRevenueCatEntitlements,
  trialStatusFromStore,
} from "./entitlements";
import {
  billingIssuePatch,
  canceledSubscriptionPatch,
  expiredSubscriptionPatch,
  type SubscriptionSyncInput,
  upsertUserSubscription,
} from "./subscription-sync-server";
import { mapRevenueCatSubscriberToSubscriptionState } from "./revenuecat";
import type { SubscriptionPatchFromStore } from "./native-bridge";

export const REVENUECAT_WEBHOOK_EVENTS = [
  "INITIAL_PURCHASE",
  "RENEWAL",
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
] as const;

export type RevenueCatWebhookEventType = (typeof REVENUECAT_WEBHOOK_EVENTS)[number];

export interface RevenueCatWebhookEvent {
  type: RevenueCatWebhookEventType | string;
  app_user_id?: string;
  product_id?: string;
  store?: string;
  expiration_at_ms?: number;
  purchased_at_ms?: number;
  period_type?: string;
  original_transaction_id?: string;
  transaction_id?: string;
  entitlement_ids?: string[];
}

export interface RevenueCatWebhookPayload {
  event?: RevenueCatWebhookEvent;
  api_version?: string;
}

export function verifyRevenueCatWebhookAuthorization(header: string | null): boolean {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  if (!header) return false;
  return header === secret || header === `Bearer ${secret}`;
}

function patchFromWebhookEvent(event: RevenueCatWebhookEvent): SubscriptionPatchFromStore | null {
  const productId = event.product_id;
  const entitlementIds = event.entitlement_ids ?? [];

  let tier = tierFromRevenueCatEntitlements(entitlementIds);
  let cycle: SubscriptionPatchFromStore["billingCycle"] = "monthly";

  if (productId) {
    const mapped = mapProductIdToEntitlement(productId);
    if (mapped) {
      tier = mapped.tier;
      cycle = mapped.cycle;
    }
  }

  if (!tier) return null;

  const expiration =
    event.expiration_at_ms != null
      ? new Date(event.expiration_at_ms).toISOString()
      : null;
  const isTrialing = event.period_type === "TRIAL" || event.period_type === "INTRO";

  const storePlatform =
    event.store === "APP_STORE" ? "ios" : event.store === "PLAY_STORE" ? "android" : null;

  return {
    tier,
    billingCycle: cycle,
    subscriptionStatus: subscriptionStatusFromStore(true, isTrialing),
    trialStatus: trialStatusFromStore(isTrialing, true),
    planStartDate:
      event.purchased_at_ms != null
        ? new Date(event.purchased_at_ms).toISOString()
        : new Date().toISOString(),
    planEndDate: expiration,
    trialEndsAt: isTrialing ? expiration : null,
    storePlatform,
    storeProductId: productId ?? null,
    storeOriginalTransactionId: event.original_transaction_id ?? null,
    storePurchaseToken: event.transaction_id ?? null,
  };
}

export async function processRevenueCatWebhook(
  payload: RevenueCatWebhookPayload
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const event = payload.event;
  if (!event?.type || !event.app_user_id) {
    return { ok: false, error: "Invalid webhook payload" };
  }

  const userId = event.app_user_id;
  const type = event.type as RevenueCatWebhookEventType;

  let patch: SubscriptionPatchFromStore | null = null;

  switch (type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "NON_RENEWING_PURCHASE":
      patch = patchFromWebhookEvent(event);
      break;
    case "CANCELLATION":
      patch = patchFromWebhookEvent(event);
      if (patch) patch = canceledSubscriptionPatch(patch);
      break;
    case "EXPIRATION":
      patch = expiredSubscriptionPatch();
      break;
    case "BILLING_ISSUE": {
      const active = patchFromWebhookEvent(event);
      patch = active ? billingIssuePatch(active) : null;
      break;
    }
    default:
      return { ok: true, skipped: true };
  }

  if (!patch && type !== "EXPIRATION") {
    return { ok: true, skipped: true };
  }

  const syncInput: SubscriptionSyncInput = {
    userId,
    patch: patch ?? expiredSubscriptionPatch(),
    source: "revenuecat_webhook",
  };

  const result = await upsertUserSubscription(syncInput);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

export { mapRevenueCatSubscriberToSubscriptionState };
