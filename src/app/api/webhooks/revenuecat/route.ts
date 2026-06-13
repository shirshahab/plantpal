import { NextResponse } from "next/server";
import {
  processRevenueCatWebhook,
  verifyRevenueCatWebhookAuthorization,
} from "@/lib/billing/revenuecat-webhook";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isSubscriptionSyncConfigured } from "@/lib/billing/subscription-sync-server";

export const dynamic = "force-dynamic";

/**
 * RevenueCat webhook — authoritative subscription updates.
 * Configure URL in RevenueCat dashboard with Authorization header = REVENUECAT_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isSubscriptionSyncConfigured()) {
    return NextResponse.json({ ok: false, error: "Backend not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (!verifyRevenueCatWebhookAuthorization(authHeader)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook authorization" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const eventType =
    payload && typeof payload === "object" && "event" in payload
      ? (payload as { event?: { type?: string } }).event?.type
      : "unknown";

  console.info("[revenuecat] webhook_received", { type: eventType });

  try {
    const result = await processRevenueCatWebhook(
      payload as Parameters<typeof processRevenueCatWebhook>[0]
    );
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, skipped: result.skipped ?? false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    console.error("[revenuecat] webhook_error", { message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
