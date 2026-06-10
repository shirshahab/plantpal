import { NextResponse } from "next/server";
import { parseJsonBody, handleAnalysisRouteError } from "@/lib/ai/parse-request-body";
import { aiError, aiSuccess } from "@/lib/ai/route-utils";
import { isOpenAIConfigured } from "@/lib/ai/openai";
import { isPlantNetEnabled } from "@/lib/integrations/plantnet";
import { runProDiagnosis } from "@/lib/health/pro-diagnosis";
import type {
  CommercialContext,
  FeedbackSignals,
  GrowthStage,
  ProDiagnosisInput,
  ProEnvironment,
  SymptomId,
} from "@/lib/types/health";

const ROUTE = "api/ai/pro-diagnosis";
const MAX_PHOTOS = 6;

function str(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === "string" ? v.trim() : "";
}

function num(obj: Record<string, unknown>, key: string): number | null {
  const v = obj[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function parseEnvironment(raw: unknown): ProEnvironment {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    temperature: str(obj, "temperature"),
    humidity: str(obj, "humidity"),
    airflow: str(obj, "airflow"),
    lightIntensity: str(obj, "lightIntensity"),
    wateringFrequency: str(obj, "wateringFrequency"),
    fertilizerUsed: str(obj, "fertilizerUsed"),
    pruningHistory: str(obj, "pruningHistory"),
  };
}

function parseCommercial(raw: unknown): CommercialContext | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.enabled !== true) return null;
  return {
    enabled: true,
    plantCount: num(obj, "plantCount"),
    roomName: str(obj, "roomName"),
    cropType: str(obj, "cropType"),
    estimatedCropValue: str(obj, "estimatedCropValue"),
    affectedPercent: num(obj, "affectedPercent"),
    growthPhase: str(obj, "growthPhase"),
    harvestTimeline: str(obj, "harvestTimeline"),
  };
}

function parseFeedbackSignals(raw: unknown): FeedbackSignals | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as { issueStats?: unknown };
  if (!obj.issueStats || typeof obj.issueStats !== "object") return null;
  const issueStats: FeedbackSignals["issueStats"] = {};
  for (const [key, value] of Object.entries(obj.issueStats as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const v = value as { correct?: unknown; wrong?: unknown };
    const correct = typeof v.correct === "number" ? v.correct : 0;
    const wrong = typeof v.wrong === "number" ? v.wrong : 0;
    if (correct + wrong > 0) issueStats[key] = { correct, wrong };
  }
  return Object.keys(issueStats).length > 0 ? { issueStats } : null;
}

const GROWTH_STAGES: GrowthStage[] = [
  "seedling",
  "vegetative",
  "flowering",
  "fruiting",
  "mature",
  "dormant",
];

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, ROUTE);
  if (!parsed.ok) return parsed.response;

  const { body, payloadBytes } = parsed.data;

  const species = str(body, "species");
  if (!species) return aiError("species is required");

  const rawStage = str(body, "growthStage");
  const growthStage: GrowthStage = GROWTH_STAGES.includes(rawStage as GrowthStage)
    ? (rawStage as GrowthStage)
    : "mature";

  const symptoms = Array.isArray(body.symptoms)
    ? (body.symptoms.filter((s): s is SymptomId => typeof s === "string") as SymptomId[])
    : [];

  const photos = Array.isArray(body.photos)
    ? body.photos
        .filter((p): p is string => typeof p === "string" && p.startsWith("data:image/"))
        .slice(0, MAX_PHOTOS)
    : [];

  const input: ProDiagnosisInput = {
    species,
    growthStage,
    locationType: str(body, "locationType") === "indoor" ? "indoor" : "outdoor",
    zipCode: str(body, "zipCode"),
    symptoms,
    otherSymptom: str(body, "otherSymptom") || undefined,
    environment: parseEnvironment(body.environment),
    commercial: parseCommercial(body.commercial),
    photoCount: photos.length,
    feedbackSignals: parseFeedbackSignals(body.feedbackSignals),
  };

  try {
    const result = await runProDiagnosis({ input, photos, payloadBytes });
    return aiSuccess(result, false);
  } catch (error) {
    return handleAnalysisRouteError(ROUTE, error, payloadBytes);
  }
}

/** Debug status probe — no secrets exposed. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    openaiKeyDetected: isOpenAIConfigured(),
    plantnetKeyDetected: isPlantNetEnabled(),
    route: "POST /api/ai/pro-diagnosis",
  });
}
