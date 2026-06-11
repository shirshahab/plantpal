/**
 * Nursery price search — SerpAPI Google Shopping when configured, mock otherwise.
 */

import { getSerpApiKey, isSerpApiKeyConfigured } from "@/lib/integrations/env-config";
import type { PriceSearchItem, PriceSearchResponse } from "@/lib/types/integrations";
import type { NurserySize } from "@/lib/types/price-checker";
import { checkPlantPrice } from "@/lib/mock/price-checker";
import { recordDataSource, recordDataSourceError } from "@/lib/data-sources/runtime";

export interface PlantPriceSearchInput {
  plantName: string;
  size: NurserySize | string;
  zipCode: string;
}

interface SerpShoppingResult {
  shopping_results?: {
    title?: string;
    source?: string;
    price?: string;
    extracted_price?: number;
    link?: string;
    delivery?: string;
  }[];
}

function parsePrice(price?: string, extracted?: number): number {
  if (typeof extracted === "number" && extracted > 0) return extracted;
  if (!price) return 0;
  const n = Number.parseFloat(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function mockPriceItems(input: PlantPriceSearchInput): PriceSearchItem[] {
  const mock = checkPlantPrice({
    plantName: input.plantName,
    size: (input.size as NurserySize) || "1 gallon",
    zipCode: input.zipCode,
    storeType: "any",
    condition: "healthy",
    hasPhoto: false,
  });

  const [low, high] = mock.fairRange;
  const mid = Math.round((low + high) / 2);

  return [
    {
      retailer: "Local nursery (est.)",
      title: `${mock.correctedName}, ${input.size}`,
      price: mid,
      size: String(input.size),
      url: "#",
      distanceOrShipping: `Fair range $${low}–$${high} near ${input.zipCode}`,
      source: "mock",
    },
    {
      retailer: mock.bigBoxLabel,
      title: `${mock.correctedName} ${input.size}`,
      price: mock.pricing.bigBoxRange[0],
      size: String(input.size),
      url: "#",
      distanceOrShipping: "Estimated big-box pricing",
      source: "mock",
    },
    {
      retailer: mock.nurseryLabel,
      title: `${mock.correctedName} premium`,
      price: mock.pricing.nurseryRange[1],
      size: String(input.size),
      url: "#",
      distanceOrShipping: "Estimated nursery pricing",
      source: "mock",
    },
  ];
}

async function searchSerpApi(input: PlantPriceSearchInput): Promise<PriceSearchItem[]> {
  const key = getSerpApiKey();
  if (!key) return [];

  try {
    const q = `${input.plantName} ${input.size} plant nursery`;
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", q);
    url.searchParams.set("api_key", key);
    url.searchParams.set("gl", "us");
    url.searchParams.set("hl", "en");

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error("[prices] SerpAPI failed:", res.status);
      recordDataSourceError("serpapi", `HTTP ${res.status}`);
      return [];
    }

    const json = (await res.json()) as SerpShoppingResult;
    const items = (json.shopping_results ?? []).slice(0, 8).map((item) => ({
      retailer: item.source ?? "Retailer",
      title: item.title ?? input.plantName,
      price: parsePrice(item.price, item.extracted_price),
      size: String(input.size),
      url: item.link ?? "#",
      distanceOrShipping: item.delivery ?? "Check shipping at retailer",
      source: "live" as const,
    }));
    if (items.length > 0) recordDataSource("serpapi", "real_api");
    return items;
  } catch (e) {
    console.error("[prices] SerpAPI error:", e);
    recordDataSourceError("serpapi", e instanceof Error ? e.message : "SerpAPI error");
    return [];
  }
}

export async function searchPlantPrices(
  input: PlantPriceSearchInput
): Promise<PriceSearchResponse> {
  const query = `${input.plantName} ${input.size}`.trim();
  const live = await searchSerpApi(input);

  if (live.length > 0) {
    return { query, results: live, source: "live" };
  }

  recordDataSource("serpapi", "mock", { fallback: true });
  return {
    query,
    results: mockPriceItems(input),
    source: "mock",
  };
}

/** @deprecated Use searchPlantPrices */
export async function fetchLivePlantPrices(
  input: Parameters<typeof checkPlantPrice>[0]
) {
  const result = await searchPlantPrices({
    plantName: input.plantName,
    size: input.size,
    zipCode: input.zipCode,
  });
  return checkPlantPrice(input);
}

export async function submitPriceReport(_report: unknown): Promise<{ ok: boolean }> {
  return { ok: true };
}

export function isSerpApiEnabled(): boolean {
  return isSerpApiKeyConfigured();
}
