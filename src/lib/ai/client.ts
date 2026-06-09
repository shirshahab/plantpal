import type {
  AIApiResponse,
  IdentifyPlantRequest,
  PlantIdentificationResponse,
} from "@/lib/types/ai";
import type { IdentifyDebugLog } from "@/lib/ai/identify-errors";
import {
  FRIENDLY_ANALYSIS_FAILED,
  FRIENDLY_PAYLOAD_TOO_LARGE,
} from "@/lib/ai/messages";

export type IdentifyPlantApiResponse = AIApiResponse<PlantIdentificationResponse> & {
  failureReason?: string;
  failureStep?: string;
  debug?: IdentifyDebugLog;
  savedPhotoUrl?: string | null;
};

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
    const fail = json as Extract<AIApiResponse<T>, { ok: false }> & {
      failureReason?: string;
      failureStep?: string;
      debug?: IdentifyDebugLog;
    };
    return {
      ok: false,
      error: fail.failureReason ?? fail.error ?? FRIENDLY_ANALYSIS_FAILED,
      failureReason: fail.failureReason,
      failureStep: fail.failureStep,
      debug: fail.debug,
    } as AIApiResponse<T>;
  }
  if (!res.ok) {
    return {
      ok: false,
      error:
        json.ok === false
          ? (json as { failureReason?: string }).failureReason ?? json.error
          : friendlyNonJsonError(res.status, text),
    };
  }
  return json;
}

export function requestCarePlan(body: import("@/lib/types/ai").CarePlanRequest) {
  return post<import("@/lib/types/ai").AICarePlanResponse>("/api/ai/care-plan", body);
}

export function requestDoctor(body: import("@/lib/types/ai").DoctorRequest) {
  return post<import("@/lib/types/ai").AIDoctorResponse>("/api/ai/doctor", body);
}

export function requestConciergePlan(body: import("@/lib/concierge/types").ConciergePlanRequest) {
  return post<
    import("@/lib/concierge/types").ConciergePlanData & { title?: string }
  >("/api/ai/concierge-plan", body);
}

export function requestGoalPlan(body: import("@/lib/types/ai").GoalPlanRequest) {
  return post<import("@/lib/types/ai").AIGoalPlanResponse>("/api/ai/goal-plan", body);
}

export function requestPriceCheck(body: import("@/lib/types/ai").PriceCheckerAIRequest) {
  return post<import("@/lib/types/ai").AIPriceCheckResponse>("/api/ai/price-checker", body);
}

export function requestIdentifyPlant(
  body: IdentifyPlantRequest
): Promise<IdentifyPlantApiResponse> {
  return post<PlantIdentificationResponse>(
    "/api/ai/identify-plant",
    body
  ) as Promise<IdentifyPlantApiResponse>;
}

export function requestScanTag(body: import("@/lib/types/ai").ScanTagRequest) {
  return post<import("@/lib/types/ai").TagScanResponse>("/api/ai/scan-tag", body);
}

export function requestAnalyzePhoto(body: import("@/lib/types/ai").AnalyzePhotoRequest) {
  return post<import("@/lib/types/ai").AIPhotoAnalyzeResponse>("/api/ai/analyze-photo", body);
}

export function requestLandscapeDesign(body: import("@/lib/landscape/types").LandscapeDesignRequest) {
  return post<import("@/lib/landscape/types").LandscapeDesignResponse>(
    "/api/ai/landscape-designer",
    body
  );
}
