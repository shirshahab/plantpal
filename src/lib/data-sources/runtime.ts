/**
 * Runtime tracking of which data layer served each feature.
 * Never stores secrets — status only.
 */

export type DataLayer = "real_api" | "supabase" | "seed" | "mock";

export type DataSourceId =
  | "openai"
  | "supabase"
  | "openweather"
  | "perenual"
  | "plantnet"
  | "plantid"
  | "serpapi"
  | "zippopotam"
  | "usda_zones"
  | "soil_database"
  | "fertilizer_database"
  | "pest_database"
  | "disease_database";

export interface DataSourceRuntime {
  id: DataSourceId;
  name: string;
  feature: string;
  configured: boolean;
  active: boolean;
  lastSource: DataLayer | null;
  fallbackUsed: boolean;
  lastError: string | null;
  lastUsedAt: string | null;
}

const runtime = new Map<DataSourceId, Omit<DataSourceRuntime, "id" | "name" | "feature" | "configured">>();

const DEFINITIONS: Record<
  DataSourceId,
  { name: string; feature: string; envKeys?: string[] }
> = {
  openai: { name: "OpenAI", feature: "AI Doctor, Care Plans, Scanner, Price AI", envKeys: ["OPENAI_API_KEY"] },
  supabase: {
    name: "Supabase",
    feature: "Plants, profiles, photos, subscriptions",
    envKeys: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  },
  openweather: { name: "OpenWeather", feature: "Live weather on /today", envKeys: ["OPENWEATHER_API_KEY"] },
  perenual: { name: "Perenual", feature: "Plant database search", envKeys: ["PERENUAL_API_KEY"] },
  plantnet: { name: "Pl@ntNet", feature: "Scanner second opinion", envKeys: ["PLANTNET_API_KEY"] },
  plantid: { name: "Plant.id", feature: "Primary plant identification", envKeys: ["PLANT_ID_API_KEY"] },
  serpapi: { name: "SerpAPI", feature: "Live shopping price search", envKeys: ["SERPAPI_KEY"] },
  zippopotam: { name: "Zippopotam", feature: "ZIP → city/state geocoding", envKeys: [] },
  usda_zones: { name: "USDA zone lookup", feature: "Hardiness zones from ZIP", envKeys: [] },
  soil_database: { name: "Soil database", feature: "/database/soils", envKeys: [] },
  fertilizer_database: { name: "Fertilizer database", feature: "/database/fertilizers", envKeys: [] },
  pest_database: { name: "Pest database", feature: "/database/pests", envKeys: [] },
  disease_database: { name: "Disease database", feature: "Plant disease reference", envKeys: [] },
};

function isConfigured(id: DataSourceId): boolean {
  const def = DEFINITIONS[id];
  if (!def.envKeys?.length) {
    if (id === "zippopotam" || id === "usda_zones") return true;
    if (
      id === "soil_database" ||
      id === "fertilizer_database" ||
      id === "pest_database" ||
      id === "disease_database"
    ) {
      return true;
    }
    return false;
  }
  return def.envKeys.every((k) => Boolean(process.env[k]?.trim()));
}

function defaultRuntime() {
  return {
    active: false,
    lastSource: null as DataLayer | null,
    fallbackUsed: false,
    lastError: null as string | null,
    lastUsedAt: null as string | null,
  };
}

export function recordDataSource(
  id: DataSourceId,
  source: DataLayer,
  options?: { fallback?: boolean; error?: string | null }
): void {
  runtime.set(id, {
    active: source !== "mock" && !options?.fallback,
    lastSource: source,
    fallbackUsed: options?.fallback ?? source === "mock",
    lastError: options?.error ?? null,
    lastUsedAt: new Date().toISOString(),
  });
}

export function recordDataSourceError(id: DataSourceId, error: string): void {
  const prev = runtime.get(id) ?? defaultRuntime();
  runtime.set(id, {
    ...prev,
    lastError: error.slice(0, 200),
    lastUsedAt: new Date().toISOString(),
  });
}

export function getDataSourcesSnapshot(): DataSourceRuntime[] {
  return (Object.keys(DEFINITIONS) as DataSourceId[]).map((id) => {
    const def = DEFINITIONS[id];
    const rt = runtime.get(id) ?? defaultRuntime();
    const configured = isConfigured(id);
    return {
      id,
      name: def.name,
      feature: def.feature,
      configured,
      active: rt.active && configured,
      lastSource: rt.lastSource,
      fallbackUsed: rt.fallbackUsed,
      lastError: rt.lastError,
      lastUsedAt: rt.lastUsedAt,
    };
  });
}

export { DEFINITIONS as DATA_SOURCE_DEFINITIONS };
