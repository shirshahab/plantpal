/**
 * Pro diagnosis orchestrator — OpenAI Vision first, rule-based fallback.
 * Server-side only (imports the OpenAI client).
 */
import { isOpenAIConfigured, visionJSON, chatJSON } from "@/lib/ai/openai";
import { GARDENER_SYSTEM_PROMPT, VISION_SAFETY_PROMPT } from "@/lib/ai/prompts";
import type {
  HealthIssueId,
  HealthSeverity,
  HealthUrgency,
  ProDiagnosis,
  ProDiagnosisInput,
  ProDiagnosisResult,
  SpreadRisk,
} from "@/lib/types/health";
import { SYMPTOM_OPTIONS } from "@/lib/types/health";
import {
  SUPPORTED_ISSUE_IDS,
  getRemedyPlan,
  ruleBasedDiagnosis,
} from "./remedy-engine";
import { buildCommercialAssessment, buildPrognosis } from "./prognosis-engine";
import { buildEvidence, deriveConfidenceTier } from "./evidence";
import { agreementConfidenceDelta, buildSecondOpinion } from "./second-opinion";
import { applyFeedbackCalibration } from "./feedback-calibration";
import {
  identifyPlantFromImageDetailed,
  isPlantNetEnabled,
} from "@/lib/integrations/plantnet";
import type { PlantNetSuggestion } from "@/lib/types/integrations";

interface AiDiagnosisRaw {
  likely_issue: string;
  issue_id: string;
  confidence: number;
  possible_causes: string[];
  severity: string;
  spread_risk: string;
  urgency: string;
  action_window: string;
  prognosis_summary: string;
  expert_verification_recommended: boolean;
  visual_evidence: string[];
}

const SCHEMA = `{
  "likely_issue": "string — hedged name, e.g. 'Powdery Mildew (likely)'",
  "issue_id": "one of: ${SUPPORTED_ISSUE_IDS.join(" | ")} | other",
  "confidence": "number 0-100",
  "possible_causes": ["string — exactly 3, most likely first"],
  "severity": "mild | moderate | severe",
  "spread_risk": "low | moderate | high",
  "urgency": "monitor | act_soon | urgent",
  "action_window": "string, e.g. 'Within 48-72 hours'",
  "prognosis_summary": "string — cautious outlook if treated vs untreated",
  "expert_verification_recommended": boolean,
  "visual_evidence": ["string — up to 3 specific observations from the photos (or [] if no photos)"]
}`;

function symptomLabels(input: ProDiagnosisInput): string {
  const labels = input.symptoms
    .map((id) => SYMPTOM_OPTIONS.find((s) => s.id === id)?.label ?? id)
    .join(", ");
  return input.otherSymptom ? `${labels}; other: ${input.otherSymptom}` : labels;
}

function buildUserPrompt(input: ProDiagnosisInput): string {
  const env = input.environment;
  const commercial = input.commercial?.enabled
    ? `\nThis is a controlled environment grow with ${input.commercial.plantCount ?? "?"} plants; about ${input.commercial.affectedPercent ?? "?"}% of the canopy appears affected. Growth phase: ${input.commercial.growthPhase || "unknown"}. Harvest timeline: ${input.commercial.harvestTimeline || "unknown"}.`
    : "";
  return [
    `Diagnose this distressed plant. Species: ${input.species || "unknown"}.`,
    `Growth stage: ${input.growthStage}. Location: ${input.locationType}. ZIP: ${input.zipCode || "unknown"}.`,
    `Reported symptoms: ${symptomLabels(input) || "none selected"}.`,
    `Environment — temperature: ${env.temperature || "unknown"}; humidity: ${env.humidity || "unknown"}; airflow: ${env.airflow || "unknown"}; light: ${env.lightIntensity || "unknown"}; watering: ${env.wateringFrequency || "unknown"}; fertilizer: ${env.fertilizerUsed || "none reported"}; pruning history: ${env.pruningHistory || "none reported"}.`,
    commercial,
    `Use cautious language throughout. Pick issue_id from the supported list when the pattern matches; use "other" only if nothing fits.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function clampEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function mapAiDiagnosis(
  raw: AiDiagnosisRaw,
  input: ProDiagnosisInput,
  photoCount: number
): ProDiagnosis {
  const issueId = SUPPORTED_ISSUE_IDS.includes(raw.issue_id as HealthIssueId)
    ? (raw.issue_id as HealthIssueId)
    : null;
  const confidence = Math.min(95, Math.max(10, Math.round(Number(raw.confidence) || 50)));
  return {
    likelyIssue: raw.likely_issue || "Plant stress (pattern unclear)",
    issueId,
    confidence,
    confidenceTier: deriveConfidenceTier(confidence, photoCount),
    evidence: buildEvidence(input),
    visualNotes: (raw.visual_evidence ?? [])
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .slice(0, 3),
    possibleCauses: (raw.possible_causes ?? []).filter(Boolean).slice(0, 3),
    severity: clampEnum<HealthSeverity>(raw.severity, ["mild", "moderate", "severe"], "moderate"),
    spreadRisk: clampEnum<SpreadRisk>(raw.spread_risk, ["low", "moderate", "high"], "moderate"),
    urgency: clampEnum<HealthUrgency>(raw.urgency, ["monitor", "act_soon", "urgent"], "act_soon"),
    actionWindow: raw.action_window || "Within 72 hours",
    prognosisSummary:
      raw.prognosis_summary ||
      "Signs suggest a treatable issue if addressed within the recommended window.",
    expertVerificationRecommended: Boolean(raw.expert_verification_recommended),
    source: "ai",
  };
}

export interface RunProDiagnosisArgs {
  input: ProDiagnosisInput;
  /** Base64 data URLs, already validated client-side, max 6. */
  photos: string[];
  payloadBytes: number;
}

export async function runProDiagnosis({
  input,
  photos,
  payloadBytes,
}: RunProDiagnosisArgs): Promise<ProDiagnosisResult> {
  const openaiKeyDetected = isOpenAIConfigured();
  let aiDiagnosis: ProDiagnosis | null = null;
  let aiStatus: "ok" | "failed" | "skipped" = "skipped";

  // The rule-based engine always runs — it's both the fallback and the
  // independent second opinion when AI succeeds.
  const rulesDiagnosis = ruleBasedDiagnosis(input);

  // Pl@ntNet species verification from the first photo (best-effort).
  let plantnetSuggestions: PlantNetSuggestion[] | null = null;
  let plantnetStatus: "ok" | "failed" | "skipped" = "skipped";
  const plantnetPromise =
    photos.length > 0 && isPlantNetEnabled()
      ? identifyPlantFromImageDetailed({ imageDataUrl: photos[0], organ: "leaf" })
      : null;

  if (openaiKeyDetected) {
    const system = `${GARDENER_SYSTEM_PROMPT}\n\n${VISION_SAFETY_PROMPT}\n\nYou are performing an advanced plant health diagnosis. Return JSON:\n${SCHEMA}`;
    const userPrompt = buildUserPrompt(input);
    try {
      const raw =
        photos.length > 0
          ? await visionJSON<AiDiagnosisRaw>(system, userPrompt, photos, { detail: "low" })
          : await chatJSON<AiDiagnosisRaw>(system, userPrompt);
      aiDiagnosis = mapAiDiagnosis(raw, input, photos.length);
      aiStatus = "ok";
    } catch (error) {
      console.error("[pro-diagnosis] AI failed, using rule-based fallback", {
        payloadBytes,
        imageCount: photos.length,
        error: error instanceof Error ? error.message.slice(0, 200) : String(error),
      });
      aiStatus = "failed";
    }
  }

  if (plantnetPromise) {
    const result = await plantnetPromise;
    if (result.suggestions.length > 0) {
      plantnetSuggestions = result.suggestions;
      plantnetStatus = "ok";
    } else {
      plantnetStatus = "failed";
    }
  }

  const fallbackUsed = aiDiagnosis === null;
  let diagnosis = aiDiagnosis ?? rulesDiagnosis;

  // Second opinion: cross-check sources and adjust confidence for
  // agreement/disagreement before deriving the final trust tier.
  const secondOpinion = buildSecondOpinion({
    primary: diagnosis,
    rules: rulesDiagnosis,
    plantnet: plantnetSuggestions,
    userSpecies: input.species,
  });
  const delta = agreementConfidenceDelta(secondOpinion.agreementLevel);
  if (delta !== 0) {
    const adjusted = Math.min(95, Math.max(15, diagnosis.confidence + delta));
    diagnosis = {
      ...diagnosis,
      confidence: adjusted,
      confidenceTier: deriveConfidenceTier(adjusted, photos.length),
    };
  }

  // Past user feedback calibrates confidence for issues with a track record.
  diagnosis = applyFeedbackCalibration(diagnosis, input.feedbackSignals);

  // Commercial growers always get the expert-verification recommendation
  // surfaced for moderate+ issues.
  if (input.commercial?.enabled && diagnosis.severity !== "mild") {
    diagnosis.expertVerificationRecommended = true;
  }
  // Low-trust diagnoses also point users to expert verification.
  if (diagnosis.confidenceTier === "low" && diagnosis.severity === "severe") {
    diagnosis.expertVerificationRecommended = true;
  }

  const remedyPlan = getRemedyPlan(diagnosis.issueId, diagnosis.likelyIssue);
  const prognosis = buildPrognosis({
    issueId: diagnosis.issueId,
    issueLabel: diagnosis.likelyIssue,
    severity: diagnosis.severity,
    spreadRisk: diagnosis.spreadRisk,
    growthStage: input.growthStage,
    plantsAffected: input.commercial?.enabled ? input.commercial.plantCount : 1,
    cropValue: input.commercial?.estimatedCropValue ?? null,
    confidence: diagnosis.confidence,
  });
  const commercialAssessment = input.commercial?.enabled
    ? buildCommercialAssessment(input.commercial, {
        issueId: diagnosis.issueId,
        issueLabel: diagnosis.likelyIssue,
        severity: diagnosis.severity,
        spreadRisk: diagnosis.spreadRisk,
      })
    : null;

  return {
    diagnosis,
    remedyPlan,
    prognosis,
    commercialAssessment,
    secondOpinion,
    debug: {
      openaiKeyDetected,
      imageCount: photos.length,
      payloadBytes,
      aiStatus,
      plantnetStatus,
      fallbackUsed,
    },
  };
}
