import { getApiBaseUrl } from "./config";

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { getSupabase } = await import("./supabase");
  const supabase = getSupabase();
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiPost<T>(
  path: string,
  body: unknown
): Promise<ApiResult<T>> {
  try {
    const auth = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...auth,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!text) {
      return { ok: false, error: `Empty response (${res.status})` };
    }

    let json: { ok?: boolean; data?: T; error?: string; failureReason?: string };
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: false, error: `Invalid JSON (${res.status})` };
    }

    if (!res.ok || json.ok === false) {
      return {
        ok: false,
        error: json.failureReason ?? json.error ?? `Request failed (${res.status})`,
      };
    }

    const payload = json as { data?: T } & T;
    return { ok: true, data: payload.data ?? payload };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export interface IdentifyResult {
  common_name: string;
  scientific_name: string;
  confidence_score: number;
  friendly_headline?: string;
  identification_rationale?: string;
  top_matches?: Array<{ common_name: string; scientific_name: string }>;
  source?: string;
  plantnet_second_opinion?: Array<{ species: string; score: number; commonNames: string[] }>;
}

export async function identifyPlant(imageDataUrl: string) {
  return apiPost<IdentifyResult>("/api/ai/identify-plant", {
    imageDataUrls: [imageDataUrl],
    photoRoles: ["whole"],
  });
}

export async function searchPlants(query: string) {
  return apiPost<{ results?: unknown[] }>("/api/plants/search", {
    query,
    limit: 10,
  });
}

export async function submitFeedback(message: string, route: string) {
  return apiPost<{ storage?: string }>("/api/feedback", {
    message,
    route,
    category: "bug",
  });
}
