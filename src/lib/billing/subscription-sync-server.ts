/**
 * Server-side subscription sync to Supabase (webhook + verified restore).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AccountTier } from "./tier-config";
import type { SubscriptionPatchFromStore } from "./native-bridge";
import type { StorePlatform, UserSubscription } from "@/lib/types/billing";

export interface SubscriptionSyncInput {
  userId: string;
  patch: SubscriptionPatchFromStore;
  source: "revenuecat_webhook" | "revenuecat_api" | "client_restore";
}

export interface SubscriptionSyncRow {
  user_id: string;
  tier: string;
  billing_cycle: string;
  status: UserSubscription["subscriptionStatus"];
  trial_ends_at: string | null;
  trial_started_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  store_platform: StorePlatform | null;
  store_product_id: string | null;
  store_original_transaction_id: string | null;
  store_purchase_token: string | null;
  updated_at: string;
}

function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function isSubscriptionSyncConfigured(): boolean {
  return Boolean(getServiceClient());
}

export function patchToDbRow(input: SubscriptionSyncInput): SubscriptionSyncRow {
  const { userId, patch } = input;
  const now = new Date().toISOString();

  return {
    user_id: userId,
    tier: patch.tier,
    billing_cycle: patch.billingCycle,
    status: patch.subscriptionStatus,
    trial_ends_at: patch.trialEndsAt ?? null,
    trial_started_at: patch.trialStartedAt ?? null,
    starts_at: patch.planStartDate ?? now,
    ends_at: patch.planEndDate ?? null,
    store_platform: patch.storePlatform ?? null,
    store_product_id: patch.storeProductId ?? null,
    store_original_transaction_id: patch.storeOriginalTransactionId ?? null,
    store_purchase_token: patch.storePurchaseToken ?? null,
    updated_at: now,
  };
}

export function dbRowToSubscriptionPatch(row: SubscriptionSyncRow): SubscriptionPatchFromStore {
  const tier =
    row.tier === AccountTier.PLUS || row.tier === AccountTier.FAMILY
      ? row.tier
      : AccountTier.FREE;

  let trialStatus: UserSubscription["trialStatus"] = "none";
  if (row.status === "trialing") trialStatus = "active";
  else if (tier !== AccountTier.FREE && row.status === "active") trialStatus = "converted";

  return {
    tier,
    billingCycle: row.billing_cycle === "annual" ? "annual" : "monthly",
    subscriptionStatus: row.status,
    trialStatus,
    planStartDate: row.starts_at,
    planEndDate: row.ends_at,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    storePlatform: row.store_platform,
    storeProductId: row.store_product_id,
    storeOriginalTransactionId: row.store_original_transaction_id,
    storePurchaseToken: row.store_purchase_token,
  };
}

export async function upsertUserSubscription(
  input: SubscriptionSyncInput
): Promise<{ ok: boolean; error?: string }> {
  const client = getServiceClient();
  if (!client) {
    return { ok: false, error: "Supabase service role not configured" };
  }

  const row = patchToDbRow(input);

  const { error } = await client.from("user_subscriptions").upsert(row, {
    onConflict: "user_id",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function fetchUserSubscriptionFromDb(
  userId: string
): Promise<SubscriptionPatchFromStore | null> {
  const client = getServiceClient();
  if (!client) return null;

  const { data, error } = await client
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return dbRowToSubscriptionPatch(data as SubscriptionSyncRow);
}

export function expiredSubscriptionPatch(): SubscriptionPatchFromStore {
  return {
    tier: AccountTier.FREE,
    billingCycle: "monthly",
    subscriptionStatus: "expired",
    trialStatus: "expired",
    planStartDate: null,
    planEndDate: new Date().toISOString(),
    trialStartedAt: null,
    trialEndsAt: null,
    storePlatform: null,
    storeProductId: null,
    storeOriginalTransactionId: null,
    storePurchaseToken: null,
  };
}

export function canceledSubscriptionPatch(
  existing: SubscriptionPatchFromStore
): SubscriptionPatchFromStore {
  return {
    ...existing,
    subscriptionStatus: "canceled",
    planEndDate: existing.planEndDate ?? new Date().toISOString(),
  };
}

export function billingIssuePatch(
  existing: SubscriptionPatchFromStore
): SubscriptionPatchFromStore {
  return {
    ...existing,
    subscriptionStatus: "active",
  };
}
