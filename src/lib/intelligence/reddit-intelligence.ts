/**
 * Reddit gardening intelligence.
 *
 * Initial mode: curated dataset (src/data/reddit-signals-lite.json) modeling
 * recurring seasonal topics across gardening communities. A scheduled import
 * job or safe backend API fetch can replace the dataset later without
 * changing callers.
 *
 * Rules: no aggressive scraping, no usernames, no user quotes. Everything
 * here is a topic-level pattern, labeled estimated.
 */

import dataset from "@/data/reddit-signals-lite.json";
import { insightId, expiresInHours } from "./source-types";
import type { LocalPlantInsight } from "./source-types";

export type RedditSignalType =
  | "common_question"
  | "rising_issue"
  | "seasonal_problem"
  | "plant_topic"
  | "content_opportunity";

export interface RedditSignal {
  season: "spring" | "summer" | "fall" | "winter" | "all";
  topic: string;
  signalType: RedditSignalType;
  communities: string[];
  summary: string;
  /** Blog/SEO angle for the content team. */
  contentAngle: string;
}

interface RawSignal {
  season: string;
  topic: string;
  signal_type: string;
  communities: string[];
  summary: string;
  content_angle: string;
}

const SIGNALS: RedditSignal[] = (dataset.signals as RawSignal[]).map((s) => ({
  season: s.season as RedditSignal["season"],
  topic: s.topic,
  signalType: s.signal_type as RedditSignalType,
  communities: s.communities,
  summary: s.summary,
  contentAngle: s.content_angle,
}));

export const TRACKED_COMMUNITIES = dataset._meta.communities;

function currentSeason(date = new Date()): RedditSignal["season"] {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

/** Signals relevant right now (current season + evergreen). */
export function getRedditSignals(season = currentSeason()): RedditSignal[] {
  return SIGNALS.filter((s) => s.season === season || s.season === "all");
}

/** Signals for a specific topic ("fungus gnats", "tomato problems"...). */
export function getRedditSignalsForTopic(topic: string): RedditSignal[] {
  const q = topic.toLowerCase();
  return SIGNALS.filter(
    (s) => s.topic.includes(q) || q.includes(s.topic)
  );
}

/** Blog/SEO content ideas from current community chatter patterns. */
export function getContentOpportunities(season = currentSeason()): string[] {
  return getRedditSignals(season).map((s) => s.contentAngle);
}

/**
 * One community-chatter insight for dashboard surfaces.
 * Example: "Gardeners are talking about fungus gnats more this week."
 */
export function getRedditPulseInsight(season = currentSeason()): LocalPlantInsight | null {
  const candidates = getRedditSignals(season).filter(
    (s) => s.signalType === "rising_issue" || s.signalType === "seasonal_problem"
  );
  if (candidates.length === 0) return null;

  // Rotate weekly so it doesn't go stale.
  const week = Math.floor(Date.now() / (7 * 86_400_000));
  const pick = candidates[week % candidates.length];

  return {
    id: insightId("reddit"),
    type: "community",
    title: `Gardeners are talking about ${pick.topic} more this week.`,
    summary: pick.summary,
    source: "reddit",
    confidence: "estimated",
    estimated: true,
    createdAt: new Date().toISOString(),
    expiresAt: expiresInHours(7 * 24),
    emoji: "💬",
  };
}

export function getRedditSignalCount(): number {
  return SIGNALS.length;
}
