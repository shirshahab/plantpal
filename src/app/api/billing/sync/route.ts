import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/ai/route-utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  fetchRevenueCatSubscriber,
  getRevenueCatServerApiKey,
  mapRevenueCatSubscriberToSubscriptionState,
} from "@/lib/billing/revenuecat";
import {
  fetchUserSubscriptionFromDb,
  isSubscriptionSyncConfigured,
  upsertUserSubscription,
} from "@/lib/billing/subscription-sync-server";

export const dynamic = "force-dynamic";

/**
 * Sync verified subscription state from RevenueCat API → Supabase.
 * Does not trust raw client tier claims; fetches subscriber from RevenueCat when configured.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
  }

  if (!isSubscriptionSyncConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Subscription sync not configured" },
      { status: 503 }
    );
  }

  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { source?: string } = {};
  try {
    body = (await request.json()) as { source?: string };
  } catch {
    /* optional body */
  }

  const apiKey = getRevenueCatServerApiKey();
  if (!apiKey) {
    const existing = await fetchUserSubscriptionFromDb(userId);
    if (!existing) {
      return NextResponse.json(
        {
          ok: false,
          error: "RevenueCat server API key not configured; cannot verify purchase",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, subscription: existing, source: "database" });
  }

  const subscriber = await fetchRevenueCatSubscriber(userId);
  if (!subscriber) {
    return NextResponse.json(
      { ok: false, error: "Could not verify subscription with RevenueCat" },
      { status: 502 }
    );
  }

  const patch = mapRevenueCatSubscriberToSubscriptionState(subscriber);
  if (!patch) {
    return NextResponse.json({
      ok: true,
      subscription: null,
      message: "No active paid entitlement",
      source: body.source ?? "client",
    });
  }

  const syncResult = await upsertUserSubscription({
    userId,
    patch,
    source: "revenuecat_api",
  });

  if (!syncResult.ok) {
    return NextResponse.json({ ok: false, error: syncResult.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    subscription: patch,
    source: body.source ?? "client",
  });
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
  }

  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await fetchUserSubscriptionFromDb(userId);
  return NextResponse.json({ ok: true, subscription });
}
