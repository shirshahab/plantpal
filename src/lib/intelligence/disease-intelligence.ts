/**
 * Disease/pest/deficiency reference intelligence.
 *
 * Backed by src/data/disease-reference-lite.json. Used by Plant Health
 * Check, Pro Diagnosis, the remedy engine, and expert review prep.
 *
 * This is educational reference data. Never phrase output as a guaranteed
 * cure; "immediate actions" are best-practice first steps.
 */

import dataset from "@/data/disease-reference-lite.json";
import type { DiseaseReference } from "./source-types";

interface RawIssue {
  issue: string;
  category: string;
  visual_signs: string[];
  common_causes: string[];
  spreads_fast: boolean;
  urgency: string;
  affected_plants: string[];
  immediate_actions: string[];
  prevention: string[];
  what_to_avoid: string[];
  when_to_rescan: string;
  source_url?: string;
}

function toReference(raw: RawIssue): DiseaseReference {
  return {
    issue: raw.issue,
    category: raw.category as DiseaseReference["category"],
    visualSigns: raw.visual_signs,
    commonCauses: raw.common_causes,
    spreadsFast: raw.spreads_fast,
    urgency: raw.urgency as DiseaseReference["urgency"],
    affectedPlants: raw.affected_plants,
    immediateActions: raw.immediate_actions,
    prevention: raw.prevention,
    whatToAvoid: raw.what_to_avoid,
    whenToRescan: raw.when_to_rescan,
    sourceUrl: raw.source_url,
  };
}

const ISSUES: DiseaseReference[] = (dataset.issues as RawIssue[]).map(toReference);

/** Exact-ish lookup by issue name ("powdery mildew", "Root rot"...). */
export function getDiseaseReference(issue?: string | null): DiseaseReference | null {
  if (!issue) return null;
  const q = issue.toLowerCase().trim();
  if (!q) return null;
  return (
    ISSUES.find((ref) => {
      const name = ref.issue.toLowerCase();
      return name === q || q.includes(name) || name.includes(q);
    }) ?? null
  );
}

export interface SymptomMatch {
  reference: DiseaseReference;
  /** 0..1 — fraction of signal tokens that matched. */
  score: number;
  matchedSigns: string[];
}

const STOP_WORDS = new Set([
  "the", "and", "with", "have", "has", "are", "is", "on", "my", "of", "a", "an",
  "in", "it", "its", "to", "or", "looks", "like", "some", "very", "plant", "leaves", "leaf",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/**
 * Match user-reported symptoms + free-text description against the
 * reference library. Returns up to `limit` candidates, best first.
 * This is a hint engine, not a diagnosis.
 */
export function matchSymptomsToIssues(
  symptoms: string[],
  description = "",
  limit = 3
): SymptomMatch[] {
  const queryTokens = new Set([
    ...symptoms.flatMap(tokenize),
    ...tokenize(description),
  ]);
  if (queryTokens.size === 0) return [];

  const matches: SymptomMatch[] = [];
  for (const ref of ISSUES) {
    const matchedSigns: string[] = [];
    let hits = 0;
    const refTokens = new Set([
      ...tokenize(ref.issue),
      ...ref.visualSigns.flatMap(tokenize),
      ...ref.commonCauses.flatMap(tokenize),
    ]);
    for (const token of queryTokens) {
      if (refTokens.has(token)) hits += 1;
    }
    for (const sign of ref.visualSigns) {
      const signTokens = tokenize(sign);
      if (signTokens.some((t) => queryTokens.has(t))) matchedSigns.push(sign);
    }
    if (hits === 0) continue;
    matches.push({
      reference: ref,
      score: hits / queryTokens.size,
      matchedSigns: matchedSigns.slice(0, 3),
    });
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** First-step remedy reference for an issue, or null. */
export function getRemedyReference(issue?: string | null): {
  immediateActions: string[];
  prevention: string[];
  whatToAvoid: string[];
} | null {
  const ref = getDiseaseReference(issue);
  if (!ref) return null;
  return {
    immediateActions: ref.immediateActions,
    prevention: ref.prevention,
    whatToAvoid: ref.whatToAvoid,
  };
}

/** Recommended rescan window for an issue, or a sane default. */
export function getRescanWindow(issue?: string | null): string {
  return getDiseaseReference(issue)?.whenToRescan ?? "5 to 7 days";
}

export function getDiseaseReferenceCount(): number {
  return ISSUES.length;
}

export function getAllDiseaseReferences(): DiseaseReference[] {
  return ISSUES;
}
