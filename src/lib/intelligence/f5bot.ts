/**
 * F5Bot intelligence — import Reddit/social alerts into PlantPal marketing data.
 *
 * Feed format matches F5Bot JSON feed / webhook payloads:
 * https://f5bot.com/docs-api
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Categories ──────────────────────────────────────────────────────────────

export const F5BOT_CATEGORIES = [
  "Diseases",
  "Pests",
  "Watering Problems",
  "Pruning",
  "Plant Identification",
  "Houseplants",
  "Fruit Trees",
  "Vegetables",
  "Flowers",
  "Competitors",
  "Feature Requests",
  "Beginner Questions",
] as const;

export type F5BotCategory = (typeof F5BOT_CATEGORIES)[number];

export type F5BotSentiment = "positive" | "negative" | "neutral";
export type F5BotOpportunityType =
  | "competitor_mention"
  | "content_opportunity"
  | "product_feedback"
  | "community_engagement"
  | "support_signal";

// ── Raw feed shapes ───────────────────────────────────────────────────────────

export interface F5BotFeedItem {
  id?: string;
  url: string;
  title?: string;
  content_html?: string;
  content_text?: string;
  date_published?: string;
  group?: string;
  username?: string;
  tags?: string[];
}

export interface F5BotJsonFeed {
  version?: string;
  title?: string;
  items?: F5BotFeedItem[];
  next_url?: string;
  _prev_url?: string;
}

export interface F5BotMentionRow {
  id?: string;
  source: string;
  platform: string;
  keyword: string;
  title: string;
  url: string;
  excerpt: string;
  full_text: string;
  subreddit: string | null;
  detected_plant: string | null;
  detected_issue: string | null;
  detected_category: string | null;
  sentiment: string | null;
  opportunity_type: string | null;
  summary: string | null;
  processed: boolean;
  created_at?: string;
  imported_at?: string;
}

export interface F5BotClassification {
  detected_plant: string | null;
  detected_issue: string | null;
  detected_category: F5BotCategory | null;
  sentiment: F5BotSentiment;
  opportunity_type: F5BotOpportunityType | null;
  summary: string;
}

export interface F5BotImportResult {
  ok: boolean;
  imported: number;
  skipped: number;
  total: number;
  error?: string;
  feedConnected: boolean;
}

export interface F5BotDashboardStats {
  feedConfigured: boolean;
  feedConnected: boolean;
  lastImportAt: string | null;
  totalMentions: number;
  mentionsToday: number;
  topKeywords: { keyword: string; count: number }[];
  topIssues: { issue: string; count: number }[];
  topPlants: { plant: string; count: number }[];
  topCategories: { category: string; count: number }[];
  fastestGrowingTopics: { topic: string; recent: number; prior: number; growth: number }[];
  competitorMentions: F5BotMentionRow[];
  contentOpportunities: F5BotMentionRow[];
  latestMentions: F5BotMentionRow[];
}

// ── Detection dictionaries ────────────────────────────────────────────────────

const PLANT_PATTERNS: { pattern: RegExp; label: string; category?: F5BotCategory }[] = [
  { pattern: /\bmeyer lemon\b/i, label: "meyer lemon", category: "Fruit Trees" },
  { pattern: /\blemon tree\b/i, label: "lemon tree", category: "Fruit Trees" },
  { pattern: /\bavocado tree\b/i, label: "avocado tree", category: "Fruit Trees" },
  { pattern: /\bbougainvillea\b/i, label: "bougainvillea", category: "Flowers" },
  { pattern: /\blavender\b/i, label: "lavender", category: "Flowers" },
  { pattern: /\brosemary\b/i, label: "rosemary", category: "Vegetables" },
  { pattern: /\btomato\b/i, label: "tomato", category: "Vegetables" },
  { pattern: /\bbasil\b/i, label: "basil", category: "Vegetables" },
  { pattern: /\bmonstera\b/i, label: "monstera", category: "Houseplants" },
  { pattern: /\bpothos\b/i, label: "pothos", category: "Houseplants" },
  { pattern: /\bsnake plant\b/i, label: "snake plant", category: "Houseplants" },
  { pattern: /\bjapanese maple\b/i, label: "japanese maple", category: "Flowers" },
];

const ISSUE_PATTERNS: { pattern: RegExp; label: string; category: F5BotCategory }[] = [
  { pattern: /\byellow leaves?\b/i, label: "yellow leaves", category: "Watering Problems" },
  { pattern: /\boverwater(?:ing|ed)?\b/i, label: "overwatering", category: "Watering Problems" },
  { pattern: /\bunderwater(?:ing|ed)?\b/i, label: "underwatering", category: "Watering Problems" },
  { pattern: /\bpowdery mildew\b/i, label: "powdery mildew", category: "Diseases" },
  { pattern: /\broot rot\b/i, label: "root rot", category: "Diseases" },
  { pattern: /\bbrown spots?\b/i, label: "brown spots", category: "Diseases" },
  { pattern: /\bleaf curl\b/i, label: "leaf curl", category: "Diseases" },
  { pattern: /\bspider mites?\b/i, label: "spider mites", category: "Pests" },
  { pattern: /\baphids?\b/i, label: "aphids", category: "Pests" },
  { pattern: /\bthrips?\b/i, label: "thrips", category: "Pests" },
  { pattern: /\bfungus gnats?\b/i, label: "fungus gnats", category: "Pests" },
  { pattern: /\bplant (?:is )?dying\b/i, label: "plant dying", category: "Watering Problems" },
  { pattern: /\bprun(?:e|ing)\b/i, label: "pruning", category: "Pruning" },
  { pattern: /\bwhat (?:plant|tree|flower) is this\b/i, label: "plant identification", category: "Plant Identification" },
  { pattern: /\bidentify (?:this|my) plant\b/i, label: "plant identification", category: "Plant Identification" },
];

const COMPETITOR_PATTERNS: RegExp[] = [
  /\bpicture\s*this\b/i,
  /\bplnt\b/i,
  /\bplanta\b/i,
  /\bblossom\b/i,
  /\bgreg\b/i,
  /\bplantin\b/i,
  /\bplantifier\b/i,
  /\bseek by inaturalist\b/i,
  /\bleafsnap\b/i,
];

const FEATURE_REQUEST_PATTERNS: RegExp[] = [
  /\bwish (?:there was|it had|the app)\b/i,
  /\bwould love (?:if|to see|an app)\b/i,
  /\bfeature request\b/i,
  /\bneeds? (?:a|an) (?:app|tool|feature)\b/i,
  /\bany app (?:for|that)\b/i,
  /\bis there an app\b/i,
];

const BEGINNER_PATTERNS: RegExp[] = [
  /\bnew to (?:gardening|plants)\b/i,
  /\bfirst (?:plant|garden|time)\b/i,
  /\bbeginner\b/i,
  /\bhow do i\b/i,
  /\bhelp me\b/i,
  /\bcomplete newbie\b/i,
  /\bno idea what i'?m doing\b/i,
];

// ── Config ────────────────────────────────────────────────────────────────────

export function getF5BotFeedUrl(): string | null {
  return process.env.F5BOT_JSON_FEED_URL?.trim() || null;
}

export function getF5BotRssFeedUrl(): string | null {
  return process.env.F5BOT_RSS_FEED_URL?.trim() || null;
}

export function getF5BotWebhookSecret(): string | null {
  return process.env.F5BOT_WEBHOOK_SECRET?.trim() || null;
}

export function isF5BotConfigured(): boolean {
  return Boolean(getF5BotFeedUrl() || getF5BotRssFeedUrl());
}

function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function parseF5BotFeedPayload(raw: unknown): F5BotFeedItem[] {
  if (Array.isArray(raw)) {
    return raw.filter(isFeedItem);
  }
  if (raw && typeof raw === "object") {
    const obj = raw as F5BotJsonFeed & { items?: unknown[] };
    if (Array.isArray(obj.items)) {
      return obj.items.filter(isFeedItem);
    }
  }
  return [];
}

function isFeedItem(v: unknown): v is F5BotFeedItem {
  return Boolean(v && typeof v === "object" && "url" in v && typeof (v as F5BotFeedItem).url === "string");
}

export function extractKeyword(item: F5BotFeedItem): string {
  if (item.tags?.length) {
    const kw = item.tags.find((t) => !/reddit|hacker|lobsters|comments|posts/i.test(t));
    if (kw) return kw;
    return item.tags[0] ?? "";
  }
  const titlePart = item.title?.split(" - ")[0]?.trim();
  return titlePart ?? "";
}

export function extractPlatform(item: F5BotFeedItem, url: string): string {
  const tagPlatform = item.tags?.find((t) =>
    /reddit|hacker news|lobsters|twitter|linkedin/i.test(t)
  );
  if (tagPlatform) {
    if (/reddit/i.test(tagPlatform)) return "reddit";
    if (/hacker/i.test(tagPlatform)) return "hackernews";
    if (/lobsters/i.test(tagPlatform)) return "lobsters";
    return tagPlatform.toLowerCase();
  }
  if (/reddit\.com/i.test(url)) return "reddit";
  if (/news\.ycombinator\.com/i.test(url)) return "hackernews";
  if (/lobste\.rs/i.test(url)) return "lobsters";
  return "unknown";
}

export function extractSubreddit(url: string, title?: string): string | null {
  const urlMatch = url.match(/reddit\.com\/r\/([^/]+)/i);
  if (urlMatch?.[1]) return urlMatch[1].toLowerCase();
  const titleMatch = title?.match(/\br\/([A-Za-z0-9_]+)/i);
  return titleMatch?.[1]?.toLowerCase() ?? null;
}

function detectSentiment(text: string): F5BotSentiment {
  const lower = text.toLowerCase();
  const negative = /\b(dying|dead|help|frustrated|killed|mold|rot|infested|emergency|sos)\b/.test(lower);
  const positive = /\b(thriving|beautiful|harvest|success|finally|love my|happy|blooming)\b/.test(lower);
  if (negative && !positive) return "negative";
  if (positive && !negative) return "positive";
  return "neutral";
}

/** Rule-based classifier for F5Bot mentions. */
export function classifyF5BotMention(input: {
  title: string;
  excerpt: string;
  full_text: string;
  keyword: string;
  subreddit: string | null;
  platform: string;
}): F5BotClassification {
  const text = `${input.title} ${input.excerpt} ${input.full_text} ${input.keyword}`.toLowerCase();

  let detected_plant: string | null = null;
  let plantCategory: F5BotCategory | null = null;
  for (const p of PLANT_PATTERNS) {
    if (p.pattern.test(text)) {
      detected_plant = p.label;
      plantCategory = p.category ?? null;
      break;
    }
  }

  let detected_issue: string | null = null;
  let issueCategory: F5BotCategory | null = null;
  for (const p of ISSUE_PATTERNS) {
    if (p.pattern.test(text)) {
      detected_issue = p.label;
      issueCategory = p.category;
      break;
    }
  }

  let detected_category: F5BotCategory | null = issueCategory ?? plantCategory;
  let opportunity_type: F5BotOpportunityType | null = null;

  if (COMPETITOR_PATTERNS.some((p) => p.test(text))) {
    detected_category = "Competitors";
    opportunity_type = "competitor_mention";
  } else if (FEATURE_REQUEST_PATTERNS.some((p) => p.test(text))) {
    detected_category = "Feature Requests";
    opportunity_type = "product_feedback";
  } else if (BEGINNER_PATTERNS.some((p) => p.test(text))) {
    detected_category = "Beginner Questions";
    opportunity_type = "content_opportunity";
  } else if (detected_issue && !detected_category) {
    detected_category = issueCategory;
    opportunity_type = "content_opportunity";
  } else if (detected_plant && plantCategory && !detected_category) {
    detected_category = plantCategory;
    opportunity_type = "community_engagement";
  } else if (!detected_category) {
    detected_category = "Beginner Questions";
    opportunity_type = "community_engagement";
  } else if (detected_category === "Diseases" || detected_category === "Pests") {
    opportunity_type = "content_opportunity";
  } else if (detected_category === "Competitors") {
    opportunity_type = "competitor_mention";
  } else {
    opportunity_type = "community_engagement";
  }

  const sentiment = detectSentiment(text);

  const sub = input.subreddit ? `r/${input.subreddit}` : input.platform;
  const parts: string[] = [];
  if (detected_issue) parts.push(`Problem: ${detected_issue}`);
  if (detected_plant) parts.push(`Plant: ${detected_plant}`);
  parts.push(`Category: ${detected_category}`);
  parts.push(`Source: ${sub}`);
  if (input.excerpt) {
    const clip = input.excerpt.slice(0, 140);
    parts.push(`Context: ${clip}${input.excerpt.length > 140 ? "…" : ""}`);
  }

  const summary = parts.join(" · ");

  return {
    detected_plant,
    detected_issue,
    detected_category,
    sentiment,
    opportunity_type,
    summary,
  };
}

export function feedItemToMentionRow(item: F5BotFeedItem): F5BotMentionRow | null {
  if (!item.url?.trim()) return null;

  const fullHtml = item.content_html ?? item.content_text ?? "";
  const full_text = item.content_text ?? stripHtml(fullHtml);
  const excerpt = full_text.slice(0, 500);
  const keyword = extractKeyword(item);
  const platform = extractPlatform(item, item.url);
  const subreddit = extractSubreddit(item.url, item.title);
  const title = item.title?.trim() || keyword || "F5Bot alert";

  const classification = classifyF5BotMention({
    title,
    excerpt,
    full_text,
    keyword,
    subreddit,
    platform,
  });

  return {
    source: "f5bot",
    platform,
    keyword,
    title,
    url: item.url.trim(),
    excerpt,
    full_text,
    subreddit,
    detected_plant: classification.detected_plant,
    detected_issue: classification.detected_issue,
    detected_category: classification.detected_category,
    sentiment: classification.sentiment,
    opportunity_type: classification.opportunity_type,
    summary: classification.summary,
    processed: false,
    created_at: item.date_published ?? new Date().toISOString(),
  };
}

// ── Feed fetch ────────────────────────────────────────────────────────────────

export async function fetchF5BotFeedItems(feedUrl?: string): Promise<{
  items: F5BotFeedItem[];
  connected: boolean;
  error?: string;
}> {
  const url = feedUrl ?? getF5BotFeedUrl();
  if (!url) {
    return { items: [], connected: false, error: "F5BOT_JSON_FEED_URL not configured" };
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "PlantPal-F5Bot-Importer/1.0" },
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return { items: [], connected: false, error: `Feed HTTP ${res.status}` };
    }
    const json: unknown = await res.json();
    const items = parseF5BotFeedPayload(json);
    return { items, connected: true };
  } catch (err) {
    return {
      items: [],
      connected: false,
      error: err instanceof Error ? err.message : "Feed fetch failed",
    };
  }
}

// ── Database ──────────────────────────────────────────────────────────────────

export async function insertF5BotMentions(
  rows: F5BotMentionRow[],
  client?: SupabaseClient | null
): Promise<{ imported: number; skipped: number }> {
  const db = client ?? getServiceClient();
  if (!db || rows.length === 0) return { imported: 0, skipped: rows.length };

  const urls = rows.map((r) => r.url);
  const { data: existing } = await db.from("f5bot_mentions").select("url").in("url", urls);
  const existingSet = new Set((existing ?? []).map((r: { url: string }) => r.url));

  const fresh = rows.filter((r) => !existingSet.has(r.url));
  if (fresh.length === 0) return { imported: 0, skipped: rows.length };

  const { error } = await db.from("f5bot_mentions").insert(fresh);
  if (error) throw new Error(error.message);

  return { imported: fresh.length, skipped: rows.length - fresh.length };
}

export async function importF5BotFeed(options?: {
  feedUrl?: string;
  client?: SupabaseClient | null;
}): Promise<F5BotImportResult> {
  const client = options?.client ?? getServiceClient();
  if (!client) {
    return { ok: false, imported: 0, skipped: 0, total: 0, feedConnected: false, error: "Supabase service role not configured" };
  }

  const { items, connected, error: fetchError } = await fetchF5BotFeedItems(options?.feedUrl);
  if (!connected) {
    return { ok: false, imported: 0, skipped: 0, total: 0, feedConnected: false, error: fetchError };
  }

  const rows = items.map(feedItemToMentionRow).filter((r): r is F5BotMentionRow => r !== null);
  try {
    const { imported, skipped } = await insertF5BotMentions(rows, client);
    return { ok: true, imported, skipped, total: items.length, feedConnected: true };
  } catch (err) {
    return {
      ok: false,
      imported: 0,
      skipped: 0,
      total: items.length,
      feedConnected: true,
      error: err instanceof Error ? err.message : "Insert failed",
    };
  }
}

export async function ingestF5BotWebhookPayload(
  payload: unknown,
  client?: SupabaseClient | null
): Promise<{ imported: number; skipped: number }> {
  const items = Array.isArray(payload)
    ? payload.filter(isFeedItem)
    : isFeedItem(payload)
      ? [payload]
      : parseF5BotFeedPayload(payload);

  const rows = items.map(feedItemToMentionRow).filter((r): r is F5BotMentionRow => r !== null);
  return insertF5BotMentions(rows, client);
}

function countByField(
  rows: F5BotMentionRow[],
  field: keyof F5BotMentionRow,
  limit = 8
): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const val = row[field];
    if (typeof val !== "string" || !val.trim()) continue;
    const key = val.trim();
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getF5BotDashboardStats(
  client?: SupabaseClient | null
): Promise<F5BotDashboardStats> {
  const db = client ?? getServiceClient();
  const feedConfigured = isF5BotConfigured();

  const empty: F5BotDashboardStats = {
    feedConfigured,
    feedConnected: false,
    lastImportAt: null,
    totalMentions: 0,
    mentionsToday: 0,
    topKeywords: [],
    topIssues: [],
    topPlants: [],
    topCategories: [],
    fastestGrowingTopics: [],
    competitorMentions: [],
    contentOpportunities: [],
    latestMentions: [],
  };

  if (!db) return empty;

  const [{ count: totalMentions }, { data: all, error }, { count: mentionsToday }] =
    await Promise.all([
      db.from("f5bot_mentions").select("id", { count: "exact", head: true }),
      db.from("f5bot_mentions").select("*").order("imported_at", { ascending: false }).limit(500),
      db
        .from("f5bot_mentions")
        .select("id", { count: "exact", head: true })
        .gte("imported_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

  if (error || !all) return { ...empty, totalMentions: totalMentions ?? 0 };

  const rows = all as F5BotMentionRow[];
  const now = Date.now();
  const dayMs = 86_400_000;

  const lastImportAt = rows[0]?.imported_at ?? null;

  const recentWeek = rows.filter((r) => {
    const t = new Date(r.imported_at ?? r.created_at ?? 0).getTime();
    return now - t <= 7 * dayMs;
  });
  const priorWeek = rows.filter((r) => {
    const t = new Date(r.imported_at ?? r.created_at ?? 0).getTime();
    return now - t > 7 * dayMs && now - t <= 14 * dayMs;
  });

  const recentCat = countByField(recentWeek, "detected_category", 20);
  const priorMap = new Map(countByField(priorWeek, "detected_category", 20).map((x) => [x.label, x.count]));

  const fastestGrowingTopics = recentCat
    .map(({ label, count }) => {
      const prior = priorMap.get(label) ?? 0;
      const growth = prior === 0 ? count : Math.round(((count - prior) / prior) * 100);
      return { topic: label, recent: count, prior, growth };
    })
    .filter((x) => x.recent >= 2)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 6);

  let feedConnected = feedConfigured;
  if (feedConfigured) {
    const probe = await fetchF5BotFeedItems();
    feedConnected = probe.connected;
  }

  return {
    feedConfigured,
    feedConnected,
    lastImportAt,
    totalMentions: totalMentions ?? rows.length,
    mentionsToday: mentionsToday ?? 0,
    topKeywords: countByField(rows, "keyword").map(({ label, count }) => ({ keyword: label, count })),
    topIssues: countByField(rows, "detected_issue").map(({ label, count }) => ({ issue: label, count })),
    topPlants: countByField(rows, "detected_plant").map(({ label, count }) => ({ plant: label, count })),
    topCategories: countByField(rows, "detected_category").map(({ label, count }) => ({
      category: label,
      count,
    })),
    fastestGrowingTopics,
    competitorMentions: rows.filter((r) => r.detected_category === "Competitors").slice(0, 10),
    contentOpportunities: rows
      .filter(
        (r) =>
          r.opportunity_type === "content_opportunity" ||
          r.detected_category === "Beginner Questions" ||
          r.detected_category === "Feature Requests"
      )
      .slice(0, 10),
    latestMentions: rows.slice(0, 20),
  };
}

export function validateF5BotWebhookSecret(headerSecret: string | null): boolean {
  const expected = getF5BotWebhookSecret();
  if (!expected) return true;
  return headerSecret === expected;
}
