/**
 * Prognosis engine — cautious recovery, spread, and impact estimates.
 *
 * Never promises exact outcomes or financial savings. All estimates are
 * ranges with hedged language ("possible", "likely", "if treated within…").
 */
import type {
  CommercialAssessment,
  CommercialContext,
  GrowthStage,
  HealthIssueId,
  HealthSeverity,
  HealthUrgency,
  Prognosis,
  SpreadRisk,
} from "@/lib/types/health";
import { HEALTH_ISSUES } from "./remedy-engine";

export interface PrognosisInput {
  issueId: HealthIssueId | null;
  issueLabel: string;
  severity: HealthSeverity;
  spreadRisk: SpreadRisk;
  growthStage: GrowthStage;
  plantsAffected?: number | null;
  cropValue?: string | null;
  environmentNotes?: string;
  confidence: number;
}

const RECOVERY_BY_SEVERITY: Record<HealthSeverity, string> = {
  mild: "Likely 1–2 weeks with consistent care",
  moderate: "Likely 2–4 weeks if the remedy plan is followed",
  severe: "Possibly 4–8 weeks; recovery depends on how much healthy tissue remains",
};

const UNTREATED_BY_SPREAD: Record<SpreadRisk, string> = {
  low: "If untreated, the issue may slowly worsen on this plant but is unlikely to spread widely.",
  moderate: "If untreated, signs suggest gradual spread to more of the plant and possibly neighboring plants.",
  high: "If untreated, this may spread quickly — dense canopies, high humidity, and poor airflow accelerate it.",
};

/** Flowering/fruiting plants have more at stake from canopy issues. */
const SENSITIVE_STAGES: GrowthStage[] = ["flowering", "fruiting"];

function impactEstimate(input: PrognosisInput): string {
  const sensitive = SENSITIVE_STAGES.includes(input.growthStage);
  if (input.severity === "mild") {
    return sensitive
      ? "Possible yield or flower impact: minimal if treated promptly."
      : "Possible impact on growth: minimal — mostly cosmetic if addressed now.";
  }
  if (input.severity === "moderate") {
    return sensitive
      ? "Possible yield or flower impact: low to moderate if treated within the recommended window."
      : "Possible impact: slowed growth this season; recovery is likely with treatment.";
  }
  return sensitive
    ? "Possible yield or flower impact: moderate to significant — early action and expert verification are worth considering."
    : "Possible impact: significant stress to the plant; some loss of foliage or growth is possible even with treatment.";
}

function recommendedUrgency(input: PrognosisInput): HealthUrgency {
  if (input.severity === "severe" || input.spreadRisk === "high") return "urgent";
  if (input.severity === "moderate" || input.spreadRisk === "moderate") return "act_soon";
  return "monitor";
}

function confidenceBand(confidence: number): "low" | "medium" | "high" {
  if (confidence >= 75) return "high";
  if (confidence >= 50) return "medium";
  return "low";
}

export function buildPrognosis(input: PrognosisInput): Prognosis {
  const multiPlant = (input.plantsAffected ?? 1) > 3;
  const recovery = RECOVERY_BY_SEVERITY[input.severity];

  return {
    expectedRecoveryTime: multiPlant
      ? `${recovery}. With multiple plants affected, full recovery across the group may take longer.`
      : recovery,
    spreadRisk: input.spreadRisk,
    impactEstimate: impactEstimate(input),
    confidence: confidenceBand(input.confidence),
    riskIfUntreated: UNTREATED_BY_SPREAD[input.spreadRisk],
    recommendedUrgency: recommendedUrgency(input),
  };
}

// ── Commercial / controlled-environment assessment ────────────────────────

function roomRiskLevel(
  affectedPercent: number,
  spreadRisk: SpreadRisk,
  severity: HealthSeverity
): "low" | "moderate" | "high" {
  if (affectedPercent >= 25 || (spreadRisk === "high" && severity !== "mild")) return "high";
  if (affectedPercent >= 10 || spreadRisk !== "low") return "moderate";
  return "low";
}

export function buildCommercialAssessment(
  ctx: CommercialContext,
  diagnosis: {
    issueId: HealthIssueId | null;
    issueLabel: string;
    severity: HealthSeverity;
    spreadRisk: SpreadRisk;
  }
): CommercialAssessment {
  const affected = Math.min(100, Math.max(0, ctx.affectedPercent ?? 0));
  const room = roomRiskLevel(affected, diagnosis.spreadRisk, diagnosis.severity);
  const def = diagnosis.issueId ? HEALTH_ISSUES[diagnosis.issueId] : null;
  const zone = ctx.roomName ? `"${ctx.roomName}"` : "this cultivation room";

  const operationalRecommendation =
    room === "high"
      ? `Signs suggest elevated room-level risk in ${zone}. Consider isolating affected plants, restricting movement between zones, sanitizing tools between plants, and prioritizing environmental corrections (airflow, humidity) today.`
      : room === "moderate"
        ? `Risk in ${zone} appears contained but worth active management. Consider flagging affected plants, increasing inspection frequency to daily, and correcting environmental conditions before the issue expands.`
        : `Current risk in ${zone} appears low. Maintain routine monitoring and keep environmental conditions stable.`;

  const estimatedImpactRange =
    room === "high"
      ? "Possible impact range: moderate to significant for affected plants if action is delayed. Early intervention typically reduces losses, though outcomes can't be guaranteed."
      : room === "moderate"
        ? "Possible impact range: low to moderate if treated within the recommended window. Outcomes depend on spread control and environmental correction."
        : "Possible impact range: minimal with routine treatment and monitoring.";

  const priorityActions: string[] = [];
  if (def) {
    priorityActions.push(...def.remedy.immediate.slice(0, 2));
  }
  priorityActions.push(
    "Inspect adjacent plants and zones before the next light cycle.",
    "Log affected plant count daily to track spread direction."
  );
  if (room !== "low") {
    priorityActions.push(
      "Limit cross-zone traffic and sanitize tools, gloves, and clothing between zones."
    );
  }
  if (ctx.harvestTimeline && /week|day|soon/i.test(ctx.harvestTimeline)) {
    priorityActions.push(
      "With harvest approaching, prioritize non-residue interventions and consider expert verification before applying anything to the crop."
    );
  }

  return {
    roomRiskLevel: room,
    canopySpreadRisk: diagnosis.spreadRisk,
    operationalRecommendation,
    estimatedImpactRange,
    priorityActions: priorityActions.slice(0, 5),
  };
}
