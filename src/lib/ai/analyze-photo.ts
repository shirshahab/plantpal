import type { AIPhotoAnalyzeResponse } from "@/lib/types/ai";
import { visionJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT, VISION_SAFETY_PROMPT } from "./prompts";

const SCHEMA = `{
  "plant_id_guess": "string or null — best plant guess, or a family-level guess like 'Nightshade family (tomato or pepper)'. Null only if truly unidentifiable",
  "plant_id_confidence": "high" | "medium" | "low",
  "issue_detected": "string — hedged, e.g. 'Likely yellowing from overwatering'",
  "likely_causes": ["string"],
  "confidence": "high" | "medium" | "low",
  "confidence_reason": "string — 1-2 sentences explaining why, citing visible evidence, e.g. 'White powder on leaf surface, poor airflow symptoms, leaf yellowing'",
  "visible_observations": ["string — what the photos clearly show, 2-4 items"],
  "info_needed": ["string — what extra photo angle or detail would raise confidence, 1-3 items, empty if confident"],
  "severity": "mild" | "moderate" | "serious",
  "what_to_do_today": "string",
  "what_to_avoid": "string",
  "when_to_rescan": "string",
  "recommended_lesson": "string or null — slug like yellow-leaves, water-deeply, or null",
  "safety_note": "string — remind to check soil/roots/pests first; label-safe products only",
  "needs_professional_help": boolean
}`;

export interface AnalyzeContext {
  nickname?: string;
  species?: string;
  zipCode?: string;
  locationType?: string;
  /** Free-text problem description from the user. Heavily weighted. */
  userDescription?: string;
  /** Selected symptom chips, e.g. ["Yellow leaves", "White powder"]. */
  symptoms?: string[];
  lastWateredAt?: string;
  lastFertilizedAt?: string;
}

function mockAnalyze(context?: AnalyzeContext): AIPhotoAnalyzeResponse {
  const described = context?.userDescription?.trim() || context?.symptoms?.length;
  return {
    plant_id_guess: context?.species ?? null,
    plant_id_confidence: context?.species ? "medium" : "low",
    issue_detected: "Likely yellowing leaves, possibly from overwatering",
    likely_causes: [
      "Soil staying wet too long",
      "Poor drainage in container",
      "Natural lower-leaf drop (less likely)",
    ],
    confidence: described ? "medium" : "low",
    confidence_reason: described
      ? "Based on your description and typical patterns. Live photo analysis is in preview mode."
      : "Live photo analysis is in preview mode, so this is a general estimate.",
    visible_observations: ["Preview mode: photo analysis unavailable"],
    info_needed: described
      ? []
      : ["A short description of what you're seeing", "A close-up of the affected leaf"],
    severity: "mild",
    what_to_do_today:
      "Check soil 2 inches deep before watering. If wet, skip watering and improve drainage.",
    what_to_avoid:
      "Do not fertilize until you confirm the issue. Avoid removing all yellow leaves at once.",
    when_to_rescan: "Check again in 5–7 days after adjusting watering.",
    recommended_lesson: "yellow-leaves",
    safety_note:
      "This is a visual estimate only. Check soil moisture, inspect roots if possible, and look for pests before treating. If using any product, read the label and choose plant-safe options.",
    needs_professional_help: false,
    source: "mock",
  };
}

function daysAgo(iso?: string): number | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return Number.isFinite(days) && days >= 0 ? days : null;
}

function buildUserPrompt(photoCount: number, context?: AnalyzeContext): string {
  const lines: string[] = [
    photoCount > 1
      ? `Analyze these ${photoCount} photos of the same plant for health issues.`
      : "Analyze this plant photo for health issues.",
  ];

  const description = context?.userDescription?.trim();
  if (description) {
    lines.push(
      `The owner describes the problem as: "${description.slice(0, 600)}". Weight this description heavily — it reports symptoms over time that a single photo can miss.`
    );
  }
  if (context?.symptoms?.length) {
    lines.push(`The owner tapped these symptoms: ${context.symptoms.join(", ")}.`);
  }

  const facts: string[] = [];
  if (context?.nickname || context?.species) {
    facts.push(
      `Plant: ${context.nickname ?? "Unknown"}${context.species ? ` (${context.species})` : ""}`
    );
  }
  if (context?.locationType) facts.push(`Grown ${context.locationType}`);
  if (context?.zipCode) facts.push(`ZIP ${context.zipCode}`);
  const watered = daysAgo(context?.lastWateredAt);
  if (watered !== null) facts.push(`Last watered ${watered} day(s) ago`);
  const fed = daysAgo(context?.lastFertilizedAt);
  if (fed !== null) facts.push(`Last fertilized ${fed} day(s) ago`);
  if (facts.length) lines.push(`Known context: ${facts.join(". ")}.`);

  lines.push(
    "First attempt a plant ID, but DO NOT block the diagnosis on it. If the plant ID is uncertain, set plant_id_confidence to low, give a family-level guess in plant_id_guess, and still diagnose the visible symptoms.",
    "Be honest about confidence. List what you can clearly see in visible_observations and what extra angle or info would help in info_needed. Use hedged language throughout (may, likely, looks like)."
  );

  return lines.join("\n");
}

export async function analyzePlantPhoto(
  imageDataUrl: string | string[],
  context?: AnalyzeContext
): Promise<AIPhotoAnalyzeResponse> {
  if (!isOpenAIConfigured()) {
    return mockAnalyze(context);
  }

  const urls = Array.isArray(imageDataUrl) ? imageDataUrl : [imageDataUrl];

  const raw = await visionJSON<Omit<AIPhotoAnalyzeResponse, "source">>(
    `${GARDENER_SYSTEM_PROMPT}\n\n${VISION_SAFETY_PROMPT}\n\nDiagnose visible plant health issues from the photo(s). Plant identification and health diagnosis are SEPARATE judgments — an uncertain ID must never stop a symptom diagnosis. Return JSON:\n${SCHEMA}`,
    buildUserPrompt(urls.length, context),
    urls,
    { detail: "auto" }
  );

  return {
    ...raw,
    plant_id_guess: raw.plant_id_guess ?? context?.species ?? null,
    plant_id_confidence: raw.plant_id_confidence ?? "low",
    visible_observations: raw.visible_observations ?? [],
    info_needed: raw.info_needed ?? [],
    confidence_reason: raw.confidence_reason ?? "",
    source: "ai",
  };
}

/** Convert photo analysis to doctor report shape for health_reports storage. */
export function toDoctorReportPayload(report: AIPhotoAnalyzeResponse) {
  return {
    likely_issue: report.issue_detected,
    confidence: report.confidence,
    possible_causes: report.likely_causes,
    what_to_do_today: report.what_to_do_today,
    what_to_avoid: report.what_to_avoid,
    when_to_check_back: report.when_to_rescan,
    severity: report.severity,
    needs_professional_help: report.needs_professional_help,
    source: report.source,
  };
}
