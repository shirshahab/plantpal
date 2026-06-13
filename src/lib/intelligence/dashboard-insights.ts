/**
 * Server-only dashboard intelligence from stored F5Bot mentions (Supabase).
 * Never fetches F5Bot feed directly here — reads plant_intelligence_mentions only.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { classifyF5BotMention } from "@/lib/intelligence/f5bot";
import { PLANT_SPECIES } from "@/lib/knowledge/seed";
import { lookupZipRecord } from "@/lib/location/usda-zones";

const LOOKBACK_DAYS = 7;

export interface DashboardIntelligenceContext {
  mentionedPlants: string[];
  f5Topics: string[];
  topProblems: string[];
  source: "f5bot" | "fallback";
  fetchedAt: string | null;
  /** Mention counts for pulse weighting (same order as f5Topics where applicable). */
  topicCounts: { topic: string; count: number }[];
  recentMentionCount: number;
}

export interface DashboardIntelligenceInput {
  city?: string;
  zone?: string;
  zipCode?: string;
}

interface MentionRow {
  title: string;
  content_snippet: string;
  matched_keyword: string;
  source_type: string;
  topic: string | null;
  plant_type: string | null;
  problem_type: string | null;
  created_at: string;
}

function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function resolveLocation(input: DashboardIntelligenceInput): { city: string; zone: string } {
  if (input.city?.trim() && input.zone?.trim()) {
    return { city: input.city.trim(), zone: input.zone.trim() };
  }
  const zip = input.zipCode?.trim().slice(0, 5);
  if (zip) {
    const record = lookupZipRecord(zip);
    return { city: record.city || "local", zone: record.usdaZone || "10a" };
  }
  return { city: input.city?.trim() || "local", zone: input.zone?.trim() || "10a" };
}

function isUsable(value: string | null | undefined): value is string {
  return Boolean(value?.trim() && value.trim().toLowerCase() !== "unknown");
}

function inferFromRow(row: MentionRow): {
  plant: string | null;
  topic: string | null;
  problem: string | null;
} {
  let plant = isUsable(row.plant_type) ? row.plant_type : null;
  let topic = isUsable(row.topic) ? row.topic : null;
  let problem = isUsable(row.problem_type) ? row.problem_type : null;

  if (plant && topic && problem) {
    return { plant, topic, problem };
  }

  const classified = classifyF5BotMention({
    title: row.title,
    excerpt: row.content_snippet,
    full_text: row.content_snippet,
    keyword: row.matched_keyword,
    subreddit: null,
    platform: row.source_type,
  });

  if (!plant && classified.detected_plant) plant = classified.detected_plant;
  if (!topic && classified.detected_category) topic = classified.detected_category.toLowerCase();
  if (!problem && classified.detected_issue) problem = classified.detected_issue;

  return { plant, topic, problem };
}

/** Map F5Bot plant label to a trending catalog common_name when possible. */
export function resolveTrendingPlantName(label: string): string | null {
  const lower = label.toLowerCase().trim();
  if (!lower) return null;

  const exact = PLANT_SPECIES.find((s) => s.common_name.toLowerCase() === lower);
  if (exact) return exact.common_name;

  const contains = PLANT_SPECIES.find(
    (s) =>
      s.common_name.toLowerCase().includes(lower) ||
      lower.includes(s.common_name.toLowerCase().split(/\s+/)[0] ?? "")
  );
  if (contains) return contains.common_name;

  const wordMatch = PLANT_SPECIES.find((s) => {
    const words = lower.split(/\s+/);
    return words.some((w) => w.length > 3 && s.common_name.toLowerCase().includes(w));
  });
  return wordMatch?.common_name ?? null;
}

function topKeys(counts: Map<string, number>, limit: number): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function aggregateMentions(rows: MentionRow[]): {
  mentionedPlants: string[];
  f5Topics: string[];
  topProblems: string[];
  topicCounts: { topic: string; count: number }[];
  fetchedAt: string | null;
} {
  const plantCounts = new Map<string, number>();
  const topicCountsMap = new Map<string, number>();
  const problemCounts = new Map<string, number>();
  let fetchedAt: string | null = null;

  for (const row of rows) {
    if (!fetchedAt || row.created_at > fetchedAt) fetchedAt = row.created_at;

    const { plant, topic, problem } = inferFromRow(row);

    if (plant) {
      const trendingName = resolveTrendingPlantName(plant);
      if (trendingName) {
        plantCounts.set(trendingName, (plantCounts.get(trendingName) ?? 0) + 1);
      }
    }
    if (topic) {
      topicCountsMap.set(topic, (topicCountsMap.get(topic) ?? 0) + 1);
    }
    if (problem) {
      problemCounts.set(problem, (problemCounts.get(problem) ?? 0) + 1);
    }
  }

  const topicCounts = [...topicCountsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, count]) => ({ topic, count }));

  return {
    mentionedPlants: topKeys(plantCounts, 8),
    f5Topics: topKeys(topicCountsMap, 6),
    topProblems: topKeys(problemCounts, 5),
    topicCounts,
    fetchedAt,
  };
}

const EMPTY_CONTEXT: DashboardIntelligenceContext = {
  mentionedPlants: [],
  f5Topics: [],
  topProblems: [],
  source: "fallback",
  fetchedAt: null,
  topicCounts: [],
  recentMentionCount: 0,
};

/** Load recent F5Bot mention signals for dashboard trending + pulse. */
export async function getDashboardIntelligenceContext(
  input: DashboardIntelligenceInput = {}
): Promise<DashboardIntelligenceContext> {
  resolveLocation(input); // reserved for future geo-filtering

  const db = getServiceClient();
  if (!db) return { ...EMPTY_CONTEXT };

  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  const { data, error } = await db
    .from("plant_intelligence_mentions")
    .select("title, content_snippet, matched_keyword, source_type, topic, plant_type, problem_type, created_at")
    .eq("source", "f5bot")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data?.length) {
    return { ...EMPTY_CONTEXT, recentMentionCount: 0 };
  }

  const rows = data as MentionRow[];
  const aggregated = aggregateMentions(rows);
  const hasSignals =
    aggregated.mentionedPlants.length > 0 ||
    aggregated.f5Topics.length > 0 ||
    aggregated.topProblems.length > 0;

  return {
    ...aggregated,
    source: hasSignals ? "f5bot" : "fallback",
    recentMentionCount: rows.length,
  };
}
