import type {
  AIApiResponse,
  AICarePlanResponse,
  AIDoctorResponse,
  AIGoalPlanResponse,
  AIPhotoAnalyzeResponse,
  AIPriceCheckResponse,
  AnalyzePhotoRequest,
  CarePlanRequest,
  DoctorRequest,
  GoalPlanRequest,
  IdentifyPlantRequest,
  PlantIdentificationResponse,
  PriceCheckerAIRequest,
  ScanTagRequest,
  TagScanResponse,
} from "@/lib/types/ai";
import {
  FRIENDLY_ANALYSIS_FAILED,
  FRIENDLY_PAYLOAD_TOO_LARGE,
} from "@/lib/ai/messages";

function friendlyNonJsonError(status: number, bodyText: string): string {
  if (
    status === 413 ||
    /request entity too large/i.test(bodyText) ||
    /payload too large/i.test(bodyText)
  ) {
    return FRIENDLY_PAYLOAD_TOO_LARGE;
  }
  return FRIENDLY_ANALYSIS_FAILED;
}

async function post<T>(path: string, body: unknown): Promise<AIApiResponse<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: FRIENDLY_ANALYSIS_FAILED };
  }

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (!contentType.includes("application/json")) {
    return { ok: false, error: friendlyNonJsonError(res.status, text) };
  }

  let json: AIApiResponse<T>;
  try {
    json = JSON.parse(text) as AIApiResponse<T>;
  } catch {
    return { ok: false, error: friendlyNonJsonError(res.status, text) };
  }

  if (!res.ok && json.ok === false) {
    return json;
  }
  if (!res.ok) {
    return {
      ok: false,
      error: json.ok === false ? json.error : friendlyNonJsonError(res.status, text),
    };
  }
  return json;
}

export function requestCarePlan(body: CarePlanRequest) {
  return post<AICarePlanResponse>("/api/ai/care-plan", body);
}

export function requestDoctor(body: DoctorRequest) {
  return post<AIDoctorResponse>("/api/ai/doctor", body);
}

export function requestConciergePlan(body: import("@/lib/concierge/types").ConciergePlanRequest) {
  return post<
    import("@/lib/concierge/types").ConciergePlanData & { title?: string }
  >("/api/ai/concierge-plan", body);
}

export function requestGoalPlan(body: GoalPlanRequest) {
  return post<AIGoalPlanResponse>("/api/ai/goal-plan", body);
}

export function requestPriceCheck(body: PriceCheckerAIRequest) {
  return post<AIPriceCheckResponse>("/api/ai/price-checker", body);
}

export function requestIdentifyPlant(body: IdentifyPlantRequest) {
  return post<PlantIdentificationResponse>("/api/ai/identify-plant", body);
}

export function requestScanTag(body: ScanTagRequest) {
  return post<TagScanResponse>("/api/ai/scan-tag", body);
}

export function requestAnalyzePhoto(body: AnalyzePhotoRequest) {
  return post<AIPhotoAnalyzeResponse>("/api/ai/analyze-photo", body);
}

export function requestLandscapeDesign(body: import("@/lib/landscape/types").LandscapeDesignRequest) {
  return post<import("@/lib/landscape/types").LandscapeDesignResponse>(
    "/api/ai/landscape-designer",
    body
  );
}
