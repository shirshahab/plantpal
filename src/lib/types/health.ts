/**
 * PlantPal Pro Health Intelligence types.
 *
 * Language rules: all user-facing copy must stay cautious and compliance-safe
 * ("likely", "possible", "signs suggest", "consider") — never guarantee a
 * cure, never make pesticide or legal claims.
 */

export type HealthIssueId =
  | "powdery_mildew"
  | "spider_mites"
  | "aphids"
  | "thrips"
  | "whiteflies"
  | "mealybugs"
  | "scale"
  | "root_rot"
  | "overwatering"
  | "underwatering"
  | "nitrogen_deficiency"
  | "potassium_deficiency"
  | "magnesium_deficiency"
  | "calcium_deficiency"
  | "nutrient_burn"
  | "heat_stress"
  | "cold_stress"
  | "sunburn"
  | "transplant_shock"
  | "poor_airflow"
  | "botrytis_risk";

export type HealthSeverity = "mild" | "moderate" | "severe";
export type SpreadRisk = "low" | "moderate" | "high";
export type HealthUrgency = "monitor" | "act_soon" | "urgent";

/** Trust tier shown to the user — derived from score + photo quality. */
export type ConfidenceTier = "high" | "medium" | "low" | "needs_photos";

export type EvidenceCategory =
  | "leaf_pattern"
  | "color"
  | "spots"
  | "powder"
  | "pests"
  | "environment"
  | "watering_history";

/** One line of the "why PlantPal thinks this" checklist. */
export interface EvidenceItem {
  category: EvidenceCategory;
  label: string;
  detail: string;
  observed: boolean;
}

export type SecondOpinionSourceId = "openai" | "rules" | "plantnet";

export interface SecondOpinionSource {
  source: SecondOpinionSourceId;
  label: string;
  finding: string;
  /** null when the source can't agree/disagree (e.g. species-only check). */
  agreesWithPrimary: boolean | null;
}

export interface SecondOpinion {
  sources: SecondOpinionSource[];
  agreementLevel: "strong" | "partial" | "low" | "single_source";
  note: string;
}

export type FeedbackVerdict = "correct" | "wrong";
export type FeedbackOutcome = "improved" | "worse";

export interface DiagnosisFeedback {
  id: string;
  healthReportId: string;
  issueId: HealthIssueId | null;
  verdict: FeedbackVerdict | null;
  outcome: FeedbackOutcome | null;
  createdAt: string;
  updatedAt: string;
}

/** Aggregated past-feedback accuracy, sent with diagnosis requests so the
 * engine can calibrate confidence for issues it has gotten wrong before. */
export interface FeedbackSignals {
  issueStats: Record<string, { correct: number; wrong: number }>;
}
export type HealthReportStatus =
  | "active"
  | "monitoring"
  | "improved"
  | "resolved"
  | "escalated";

export type GrowthStage =
  | "seedling"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "mature"
  | "dormant";

export const SYMPTOM_OPTIONS = [
  { id: "white_powder", label: "White powder on leaves" },
  { id: "yellow_leaves", label: "Yellow leaves" },
  { id: "brown_spots", label: "Brown spots" },
  { id: "curling_leaves", label: "Curling leaves" },
  { id: "pests_visible", label: "Pests visible" },
  { id: "webbing", label: "Webbing" },
  { id: "wilting", label: "Wilting" },
  { id: "leaf_drop", label: "Leaf drop" },
  { id: "slow_growth", label: "Slow growth" },
  { id: "mold_fungus", label: "Mold / fungus" },
  { id: "nutrient_burn", label: "Burnt / crispy leaf tips" },
  { id: "speckling", label: "Tiny speckles on leaves" },
  { id: "sticky_residue", label: "Sticky residue" },
  { id: "soggy_soil", label: "Soggy soil / odor" },
  { id: "other", label: "Other" },
] as const;

export type SymptomId = (typeof SYMPTOM_OPTIONS)[number]["id"];

export const PHOTO_SLOTS = [
  { id: "whole_plant", label: "Whole plant" },
  { id: "leaf_top", label: "Leaf top" },
  { id: "leaf_underside", label: "Leaf underside" },
  { id: "stem", label: "Stem" },
  { id: "soil_root", label: "Soil / root zone" },
  { id: "closeup", label: "Affected area close-up" },
] as const;

export type PhotoSlotId = (typeof PHOTO_SLOTS)[number]["id"];

export interface ProEnvironment {
  temperature: string;
  humidity: string;
  airflow: string;
  lightIntensity: string;
  wateringFrequency: string;
  fertilizerUsed: string;
  pruningHistory: string;
}

export interface CommercialContext {
  enabled: boolean;
  plantCount: number | null;
  roomName: string;
  cropType: string;
  estimatedCropValue: string;
  affectedPercent: number | null;
  growthPhase: string;
  harvestTimeline: string;
}

export interface ProDiagnosis {
  likelyIssue: string;
  /** Matched remedy-engine issue, when recognized. */
  issueId: HealthIssueId | null;
  /** 0–100 */
  confidence: number;
  confidenceTier: ConfidenceTier;
  possibleCauses: string[];
  severity: HealthSeverity;
  spreadRisk: SpreadRisk;
  urgency: HealthUrgency;
  /** e.g. "Within 48–72 hours" */
  actionWindow: string;
  prognosisSummary: string;
  expertVerificationRecommended: boolean;
  /** Why PlantPal reached this diagnosis. */
  evidence: EvidenceItem[];
  /** Visual observations from photo analysis (AI only). */
  visualNotes: string[];
  /** Set when past feedback adjusted the confidence. */
  calibrationNote?: string;
  source: "ai" | "rules";
}

export interface RemedyPlan {
  issueId: HealthIssueId | null;
  issueLabel: string;
  immediate: string[];
  next72Hours: string[];
  day7Plan: string[];
  day14Plan: string[];
  avoid: string[];
  escalation: string;
}

export interface Prognosis {
  expectedRecoveryTime: string;
  spreadRisk: SpreadRisk;
  impactEstimate: string;
  confidence: "low" | "medium" | "high";
  riskIfUntreated: string;
  recommendedUrgency: HealthUrgency;
}

export interface CommercialAssessment {
  roomRiskLevel: "low" | "moderate" | "high";
  canopySpreadRisk: SpreadRisk;
  operationalRecommendation: string;
  estimatedImpactRange: string;
  priorityActions: string[];
}

export interface ProDiagnosisInput {
  species: string;
  growthStage: GrowthStage;
  locationType: "indoor" | "outdoor";
  zipCode: string;
  symptoms: SymptomId[];
  otherSymptom?: string;
  environment: ProEnvironment;
  commercial?: CommercialContext | null;
  photoCount?: number;
  /** Past feedback accuracy used to calibrate confidence. */
  feedbackSignals?: FeedbackSignals | null;
}

export interface ProHealthReport {
  id: string;
  plantId: string | null;
  species: string;
  growthStage: GrowthStage;
  locationType: "indoor" | "outdoor";
  zipCode: string;
  /** Photo slots provided (full data not persisted to keep storage small). */
  photoSlots: PhotoSlotId[];
  /** Small thumbnails of provided photos for report export. */
  photoThumbs?: Partial<Record<PhotoSlotId, string>>;
  symptoms: SymptomId[];
  otherSymptom: string;
  environment: ProEnvironment;
  diagnosis: ProDiagnosis;
  remedyPlan: RemedyPlan;
  prognosis: Prognosis;
  secondOpinion?: SecondOpinion | null;
  commercialContext: CommercialContext | null;
  commercialAssessment: CommercialAssessment | null;
  status: HealthReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProDiagnosisDebug {
  openaiKeyDetected: boolean;
  imageCount: number;
  payloadBytes: number;
  aiStatus: "ok" | "failed" | "skipped";
  plantnetStatus: "ok" | "failed" | "skipped";
  fallbackUsed: boolean;
}

export interface ProDiagnosisResult {
  diagnosis: ProDiagnosis;
  remedyPlan: RemedyPlan;
  prognosis: Prognosis;
  commercialAssessment: CommercialAssessment | null;
  secondOpinion: SecondOpinion;
  debug: ProDiagnosisDebug;
}

export const HEALTH_DISCLAIMER =
  "PlantPal is not a replacement for a licensed agronomist, arborist, or crop consultant. For severe or high-value crop issues, request expert verification. Use label-safe products and follow local regulations.";

export const DIAGNOSIS_BASIS_NOTE =
  "Diagnosis is based on visible symptoms, environment details, and plant health patterns.";

export const COMMERCIAL_DISCLAIMER =
  "PlantPal provides guidance, not guaranteed treatment. For commercial operations, verify with a licensed expert.";
