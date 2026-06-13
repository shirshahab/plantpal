import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDebugToolingEnabled } from "@/lib/dev/dev-only";
import { FOUNDER_MODE_COOKIE } from "@/lib/billing/beta-unlock";
import { isF5BotConfigured, isF5BotEnabled } from "@/lib/intelligence/f5bot";
import { contentIdeasFromTopics, trendPulseLine } from "@/lib/intelligence/content-ideas";

export const dynamic = "force-dynamic";

interface MentionRow {
  id: string;
  source: string;
  source_type: string;
  title: string;
  url: string;
  author: string | null;
  content_snippet: string;
  matched_keyword: string;
  published_at: string | null;
  topic: string | null;
  plant_type: string | null;
  problem_type: string | null;
  created_at: string;
}

function countField(rows: MentionRow[], field: keyof MentionRow, limit = 8) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const val = row[field];
    if (typeof val !== "string" || !val.trim() || val === "unknown") continue;
    map.set(val, (map.get(val) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Founder intelligence dashboard — F5Bot mention trends. */
export async function GET() {
  const cookieStore = await cookies();
  const isFounder = cookieStore.get(FOUNDER_MODE_COOKIE)?.value === "true";
  if (!isDebugToolingEnabled() && !isFounder) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      configured: false,
      enabled: isF5BotEnabled(),
      feedConfigured: isF5BotConfigured(),
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return NextResponse.json({
      ok: true,
      configured: false,
      note: "Set SUPABASE_SERVICE_ROLE_KEY to load intelligence data.",
    });
  }

  const admin = createSupabaseClient(url, serviceKey, { auth: { persistSession: false } });

  const [{ count: totalMentions }, { data, error }] = await Promise.all([
    admin.from("plant_intelligence_mentions").select("id", { count: "exact", head: true }),
    admin
      .from("plant_intelligence_mentions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as MentionRow[];
  const topTopics = countField(rows, "topic");
  const topProblems = countField(rows, "problem_type");
  const topPlants = countField(rows, "plant_type");
  const contentIdeas = contentIdeasFromTopics(
    topTopics.map(({ label, count }) => ({ topic: label, count }))
  );
  const pulseLines = topTopics.slice(0, 3).map(({ label, count }) => trendPulseLine(label, count));

  return NextResponse.json({
    ok: true,
    configured: true,
    enabled: isF5BotEnabled(),
    feedConfigured: isF5BotConfigured(),
    totalMentions: totalMentions ?? rows.length,
    topTopics,
    topProblems,
    topPlants,
    pulseLines,
    contentIdeas,
    latestMentions: rows.slice(0, 25),
  });
}
