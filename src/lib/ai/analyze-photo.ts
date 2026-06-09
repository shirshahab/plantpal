import type { AIPhotoAnalyzeResponse } from "@/lib/types/ai";
import { visionJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT, VISION_SAFETY_PROMPT } from "./prompts";

const SCHEMA = `{
  "issue_detected": "string — hedged, e.g. 'Likely yellowing from overwatering'",
  "likely_causes": ["string"],
  "confidence": "high" | "medium" | "low",
  "severity": "mild" | "moderate" | "serious",
  "what_to_do_today": "string",
  "what_to_avoid": "string",
  "when_to_rescan": "string",
  "recommended_lesson": "string or null — slug like yellow-leaves, water-deeply, or null",
  "safety_note": "string — remind to check soil/roots/pests first; label-safe products only",
  "needs_professional_help": boolean
}`;

function mockAnalyze(): AIPhotoAnalyzeResponse {
  return {
    issue_detected: "Likely yellowing leaves — possibly from overwatering",
    likely_causes: [
      "Soil staying wet too long",
      "Poor drainage in container",
      "Natural lower-leaf drop (less likely)",
    ],
    confidence: "medium",
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

export async function analyzePlantPhoto(
  imageDataUrl: string,
  context?: {
    nickname?: string;
    species?: string;
    zipCode?: string;
    locationType?: string;
  }
): Promise<AIPhotoAnalyzeResponse> {
  if (!isOpenAIConfigured()) {
    return mockAnalyze();
  }

  const ctx = context
    ? `\nContext: ${context.nickname ?? "Unknown plant"} (${context.species ?? "unknown species"}), ZIP ${context.zipCode ?? "unknown"}, ${context.locationType ?? "unknown location"}.`
    : "";

  try {
    const raw = await visionJSON<Omit<AIPhotoAnalyzeResponse, "source">>(
      `${GARDENER_SYSTEM_PROMPT}\n\n${VISION_SAFETY_PROMPT}\n\nDiagnose visible plant health issues from the photo. Return JSON:\n${SCHEMA}`,
      `Analyze this plant photo for health issues.${ctx} Use hedged language throughout.`,
      imageDataUrl
    );
    return { ...raw, source: "ai" };
  } catch {
    return mockAnalyze();
  }
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
