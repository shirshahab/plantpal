import { NextResponse } from "next/server";
import { searchPlantSpecies as searchInternal } from "@/lib/knowledge/queries";
import { searchPlants, mapPerenualResults, isPerenualEnabled } from "@/lib/integrations/perenual";
import { suggestPlantFromOpenAI } from "@/lib/ai/plant-search-suggestion";
import { searchPlantSpecies as searchMock } from "@/lib/knowledge/mock-store";
import { suggestSpeciesCorrection } from "@/lib/knowledge/fuzzy-match";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cacheGet, cacheSet, cacheKey, CACHE_TTL } from "@/lib/api/server-cache";
import { checkRateLimit, getClientKey, RATE_LIMITS } from "@/lib/api/rate-limit";
import { recordDataSource, recordDataSourceError } from "@/lib/data-sources/runtime";
import type { PlantSearchHit, PlantSearchResponse } from "@/lib/types/integrations";
import type { SpeciesSearchFilters } from "@/lib/knowledge/types";

function normalizeScientific(name: string): string {
  return name.trim().toLowerCase();
}

export async function POST(request: Request) {
  const burst = checkRateLimit(
    `plant-search:${getClientKey(request)}`,
    RATE_LIMITS.plantSearchBurst,
    RATE_LIMITS.plantSearchBurstWindowMs,
    { request }
  );
  if (!burst.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many searches — wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: SpeciesSearchFilters & { limit?: number };
  try {
    body = (await request.json()) as SpeciesSearchFilters & { limit?: number };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const limit = Math.min(body.limit ?? 30, 50);
  const query = body.query?.trim() ?? "";

  const cacheId = cacheKey([
    "plant-search",
    query,
    body.type,
    body.sunlight,
    body.watering,
    body.zone,
    limit,
  ]);
  const cached = cacheGet<PlantSearchResponse>(cacheId);
  if (cached) {
    return NextResponse.json({ ok: true, data: cached, cached: true });
  }

  try {
    const internal = await searchInternal({
      query,
      type: body.type,
      sunlight: body.sunlight,
      watering: body.watering,
      zone: body.zone,
    });

    const internalFromSupabase = isSupabaseConfigured() && internal.length > 0;
    if (internalFromSupabase) {
      recordDataSource("supabase", "supabase");
    } else if (internal.length > 0) {
      recordDataSource("supabase", "seed");
    }

    const internalHits: PlantSearchHit[] = internal.slice(0, limit).map((s) => ({
      ...s,
      resultSource: s.source === "perenual" ? "perenual" : "plantpal",
    }));

    const seenNames = new Set(
      internalHits.map((s) => normalizeScientific(s.scientific_name || s.common_name))
    );

    let perenualHits: PlantSearchHit[] = [];
    if (query.length >= 2 && isPerenualEnabled()) {
      try {
        const external = await searchPlants(query);
        perenualHits = mapPerenualResults(external)
          .filter((s) => !seenNames.has(normalizeScientific(s.scientific_name || s.common_name)))
          .slice(0, Math.max(0, limit - internalHits.length))
          .map((s) => {
            seenNames.add(normalizeScientific(s.scientific_name || s.common_name));
            return {
              ...s,
              resultSource: "perenual" as const,
              externalId: s.id,
            };
          });
        if (perenualHits.length > 0) {
          recordDataSource("perenual", "real_api");
        }
      } catch (e) {
        recordDataSourceError("perenual", e instanceof Error ? e.message : "Perenual search failed");
        recordDataSource("perenual", "mock", { fallback: true, error: "search failed" });
      }
    }

    let aiHits: PlantSearchHit[] = [];
    const combinedSoFar = internalHits.length + perenualHits.length;
    if (query.length >= 3 && combinedSoFar < limit) {
      const suggestion = await suggestPlantFromOpenAI(query);
      if (suggestion) {
        const key = normalizeScientific(suggestion.scientific_name || suggestion.common_name);
        if (!seenNames.has(key)) {
          aiHits = [{ ...suggestion, resultSource: "ai" as const }];
          seenNames.add(key);
          recordDataSource("openai", "real_api");
        }
      }
    }

    let mockHits: PlantSearchHit[] = [];
    const allSoFar = [...internalHits, ...perenualHits, ...aiHits];
    if (allSoFar.length === 0 && query.length >= 1) {
      mockHits = searchMock({
        query,
        type: body.type,
        sunlight: body.sunlight,
        watering: body.watering,
        zone: body.zone,
      })
        .slice(0, limit)
        .map((s) => ({ ...s, resultSource: "mock" as const }));
      if (mockHits.length > 0) {
        recordDataSource("supabase", "mock", { fallback: true });
      }
    }

    const queryLower = query.toLowerCase();
    const rank = (hit: PlantSearchHit): number => {
      if (!queryLower) return 1;
      const common = hit.common_name.toLowerCase();
      const scientific = (hit.scientific_name ?? "").toLowerCase();
      if (common.startsWith(queryLower) || scientific.startsWith(queryLower)) return 0;
      if (common.includes(queryLower) || scientific.includes(queryLower)) return 1;
      return 2;
    };
    const results = [...internalHits, ...perenualHits, ...aiHits, ...mockHits]
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, limit);

    const didYouMean =
      query.length >= 4
        ? suggestSpeciesCorrection(
            query,
            results.map((r) => r.common_name)
          )
        : null;

    const response: PlantSearchResponse = {
      results,
      sources: {
        plantpal: internalHits.length,
        perenual: perenualHits.length,
        ai: aiHits.length,
        mock: mockHits.length,
      },
      didYouMean,
    };

    cacheSet(cacheId, response, CACHE_TTL.plantSearch);
    return NextResponse.json({ ok: true, data: response });
  } catch (e) {
    console.error("[api/plants/search]", e);
    recordDataSourceError("supabase", e instanceof Error ? e.message : "Plant search failed");

    const mockHits = searchMock({ query, type: body.type }).slice(0, limit).map((s) => ({
      ...s,
      resultSource: "mock" as const,
    }));
    const fallback: PlantSearchResponse = {
      results: mockHits,
      sources: { plantpal: 0, perenual: 0, ai: 0, mock: mockHits.length },
    };
    return NextResponse.json({ ok: true, data: fallback, fallback: true });
  }
}
