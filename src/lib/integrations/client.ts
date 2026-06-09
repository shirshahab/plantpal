import type { WeatherInsights } from "@/lib/types/integrations";
import type { PlantSearchResponse } from "@/lib/types/integrations";
import type { PriceSearchResponse } from "@/lib/types/integrations";
import type { IntegrationHealthCard } from "@/lib/types/integrations";
import type { PlantSpecies } from "@/lib/knowledge/types";
import type { SpeciesSearchFilters } from "@/lib/knowledge/types";
import { getMockWeatherForZip } from "@/lib/integrations/weather";
import { searchPlantSpecies as searchLocal } from "@/lib/knowledge";

interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: "Network error" };
  }
}

export async function fetchWeatherByZip(zipCode: string): Promise<WeatherInsights> {
  const json = await post<WeatherInsights>("/api/weather", { zip_code: zipCode });
  if (json.ok && json.data) return json.data;
  return getMockWeatherForZip(zipCode);
}

export async function searchPlantsApi(
  filters: SpeciesSearchFilters & { limit?: number } = {}
): Promise<PlantSearchResponse> {
  const json = await post<PlantSearchResponse>("/api/plants/search", filters);
  if (json.ok && json.data) return json.data;

  const local = searchLocal(filters).map((s) => ({
    ...s,
    resultSource: "plantpal" as const,
  }));
  return { results: local, sources: { plantpal: local.length, perenual: 0, ai: 0, mock: 0 } };
}

export async function importPlantSpecies(id: string): Promise<PlantSpecies | null> {
  const json = await post<PlantSpecies>("/api/plants/import", { id });
  return json.ok && json.data ? json.data : null;
}

export interface PlantDetailsResponse {
  species: PlantSpecies & Record<string, unknown>;
  careGuide: Record<string, unknown> | null;
  source: "perenual" | "plantpal";
}

export async function fetchPlantDetailsApi(id: string): Promise<PlantDetailsResponse | null> {
  const json = await post<PlantDetailsResponse>("/api/plants/details", { id });
  return json.ok && json.data ? json.data : null;
}

export async function searchPricesApi(input: {
  plantName: string;
  size: string;
  zipCode: string;
}): Promise<PriceSearchResponse | null> {
  const json = await post<PriceSearchResponse>("/api/prices/search", input);
  return json.ok && json.data ? json.data : null;
}

export interface IntegrationsHealthResponse {
  cards: IntegrationHealthCard[];
  summary?: {
    total: number;
    configured: number;
    live: number;
    fallback: number;
    checkedAt: string;
  };
}

export async function fetchIntegrationsHealth(): Promise<IntegrationsHealthResponse> {
  try {
    const res = await fetch("/api/integrations/health", { cache: "no-store" });
    const json = (await res.json()) as ApiResult<IntegrationHealthCard[]> & {
      summary?: IntegrationsHealthResponse["summary"];
    };
    return {
      cards: json.ok && json.data ? json.data : [],
      summary: json.summary,
    };
  } catch {
    return { cards: [] };
  }
}
