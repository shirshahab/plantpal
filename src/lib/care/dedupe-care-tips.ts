/**
 * Dedupe care tips across multiple goals.
 *
 * Two goals often produce the same advice ("Check soil before watering").
 * This module compares category + action + timing + reason and keeps the
 * first (most specific) version of each tip so the care plan reads clean:
 * no repeated watering tips, no repeated fertilizer tips, no repeated
 * pruning tips.
 */

export type CareTipCategory =
  | "watering"
  | "fertilizing"
  | "pruning"
  | "soil"
  | "light"
  | "pests"
  | "seasonal"
  | "general";

export interface CareTip {
  category: CareTipCategory;
  /** The thing to do, e.g. "Check soil moisture before watering". */
  action: string;
  /** When to do it, e.g. "after blooming", "this week". */
  timing?: string;
  /** Why it matters, e.g. "encourages branching". */
  reason?: string;
}

/** Filler words ignored when comparing two tips. */
const STOPWORDS = new Set([
  "a", "an", "the", "to", "of", "for", "and", "or", "your", "you", "it",
  "its", "this", "that", "is", "are", "be", "in", "on", "at", "with",
  "every", "each", "before", "after", "during", "while", "more", "less",
  "do", "next", "first", "then", "so", "will", "can", "should",
]);

/** Word stems that mean the same thing in care advice. */
const SYNONYMS: Record<string, string> = {
  water: "water",
  watering: "water",
  watered: "water",
  moisture: "water",
  moist: "water",
  hydrate: "water",
  soak: "water",
  feed: "feed",
  feeding: "feed",
  fertilize: "feed",
  fertilizer: "feed",
  fertilizing: "feed",
  fertilized: "feed",
  nutrition: "feed",
  prune: "prune",
  pruning: "prune",
  trim: "prune",
  trimming: "prune",
  cut: "prune",
  cutting: "prune",
  deadhead: "deadhead",
  deadheading: "deadhead",
  inspect: "inspect",
  inspection: "inspect",
  check: "check",
  checking: "check",
  soil: "soil",
  dirt: "soil",
  bloom: "bloom",
  blooms: "bloom",
  blooming: "bloom",
  flower: "bloom",
  flowers: "bloom",
  flowering: "bloom",
  fruit: "fruit",
  fruits: "fruit",
  fruiting: "fruit",
  pest: "pest",
  pests: "pest",
  leaf: "leaf",
  leaves: "leaf",
};

function normalizeWord(word: string): string {
  return SYNONYMS[word] ?? word;
}

/** Lowercase, strip emoji/punctuation, drop filler, map synonyms. */
function tokenize(text: string): Set<string> {
  const cleaned = text
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = new Set<string>();
  for (const word of cleaned.split(" ")) {
    if (!word || STOPWORDS.has(word)) continue;
    tokens.add(normalizeWord(word));
  }
  return tokens;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let overlap = 0;
  for (const token of a) {
    if (b.has(token)) overlap++;
  }
  const union = a.size + b.size - overlap;
  return union === 0 ? 0 : overlap / union;
}

/** Two tips are duplicates when their normalized content mostly overlaps. */
const DUPLICATE_THRESHOLD = 0.6;

function tipTokens(tip: CareTip): Set<string> {
  return tokenize(
    [tip.action, tip.timing ?? "", tip.reason ?? ""].join(" ")
  );
}

function isDuplicate(a: { tokens: Set<string>; tip: CareTip }, b: CareTip, bTokens: Set<string>): boolean {
  if (a.tip.category !== b.category) return false;
  const score = jaccard(a.tokens, bTokens);
  if (score >= DUPLICATE_THRESHOLD) return true;
  // Containment: a short tip fully covered by a longer one is a duplicate.
  const [small, large] =
    a.tokens.size <= bTokens.size ? [a.tokens, bTokens] : [bTokens, a.tokens];
  if (small.size === 0) return false;
  let covered = 0;
  for (const token of small) {
    if (large.has(token)) covered++;
  }
  return covered / small.size >= 0.85;
}

/**
 * Remove duplicate structured tips. Keeps the first occurrence, so put
 * higher-priority goals first in the input array.
 */
export function dedupeCareTips(tips: CareTip[]): CareTip[] {
  const kept: { tokens: Set<string>; tip: CareTip }[] = [];
  for (const tip of tips) {
    const tokens = tipTokens(tip);
    const dupe = kept.some((existing) => isDuplicate(existing, tip, tokens));
    if (!dupe) kept.push({ tokens, tip });
  }
  return kept.map((k) => k.tip);
}

/**
 * Convenience for plain string tip lists (seasonal tasks, warnings,
 * goal tips). Category defaults to "general" so only near-identical
 * lines collapse.
 */
export function dedupeTipStrings(
  lines: string[],
  category: CareTipCategory = "general"
): string[] {
  const tips = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((action) => ({ category, action }));
  return dedupeCareTips(tips).map((t) => t.action);
}
