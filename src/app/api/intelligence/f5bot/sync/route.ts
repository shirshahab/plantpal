import { NextResponse } from "next/server";
import {
  fetchF5BotFeed,
  ingestF5BotItems,
  isF5BotEnabled,
  verifyF5BotWebhookSignature,
} from "@/lib/intelligence/f5bot";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/**
 * Manual F5Bot JSON feed sync. Protected by x-f5bot-secret header.
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
    return NextResponse.json({ ok: false, error: "Invalid secret" }, { status: 401 });
  }

  const { items, connected, error } = await fetchF5BotFeed();
  if (!connected) {
    return NextResponse.json({ ok: false, error: error ?? "Feed fetch failed" }, { status: 502 });
  }

  try {
    const { ingested, skipped } = await ingestF5BotItems(items);
    return NextResponse.json({ ok: true, ingested, skipped, total: items.length });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Ingest failed" },
      { status: 500 }
    );
  }
}
