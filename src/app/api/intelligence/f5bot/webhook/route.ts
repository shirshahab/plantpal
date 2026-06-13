import { NextResponse } from "next/server";
import {
  ingestF5BotWebhookPayload,
  isF5BotEnabled,
  verifyF5BotWebhookSignature,
} from "@/lib/intelligence/f5bot";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/**
 * Receive F5Bot webhook alerts (same JSON shape as feed items).
 * Validates x-f5bot-secret when F5BOT_WEBHOOK_SECRET is set.
 */
export async function POST(request: Request) {
  if (!isF5BotEnabled()) {
    return NextResponse.json({ ok: false, error: "F5Bot disabled" }, { status: 503 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
  }

  const secret = request.headers.get("x-f5bot-secret");
  if (!verifyF5BotWebhookSignature(secret)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook secret" }, { status: 401 });
  }

  console.info("[f5bot] webhook_received");

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { imported, skipped } = await ingestF5BotWebhookPayload(payload);
    return NextResponse.json({ ok: true, ingested: imported, skipped });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Webhook ingest failed" },
      { status: 500 }
    );
  }
}
