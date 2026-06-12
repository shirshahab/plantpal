import { NextResponse } from "next/server";
import { importF5BotFeed, isF5BotConfigured } from "@/lib/intelligence/f5bot";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/**
 * Pull F5Bot JSON feed, classify mentions, and store in Supabase.
 * Server-only — feed URL never exposed to the client.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "Supabase not configured",
      imported: 0,
      skipped: 0,
      total: 0,
      feedConnected: false,
    });
  }

  if (!isF5BotConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "F5BOT_JSON_FEED_URL not configured",
      imported: 0,
      skipped: 0,
      total: 0,
      feedConnected: false,
    });
  }

  const result = await importF5BotFeed();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
