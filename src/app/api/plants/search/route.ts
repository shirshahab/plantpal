import { NextResponse } from "next/server";
import { searchPlantSpecies as searchInternal } from "@/lib/knowledge/queries";
import { searchPlants, mapPerenualResults, isPerenualEnabled } from "@/lib/integrations/perenual";
import type { PlantSearchHit, PlantSearchResponse } from "@/lib/types/integrations";
import type { SpeciesSearchFilters } from "@/lib/knowledge/types";

export async function POST(request: Request) {
  let body: SpeciesSearchFilters & { limit?: number };
  try {
    body = (await request.json()) as SpeciesSearchFilters & { limit?: number };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const limit = Math.min(body.limit ?? 30, 50);
  const query = body.query?.trim() ?? "";

  try {
    const internal = await searchInternal({
      query,
      type: body.type,
      sunlight: body.sunlight,
      watering: body.watering,
      zone: body.zone,
    });

    const internalHits: PlantSearchHit[] = internal.slice(0, limit).map((s) => ({
      ...s,
      resultSource: s.source === "perenual" ? "perenual" : "plantpal",
    }));

    let perenualHits: PlantSearchHit[] = [];
    if (query.length >= 2 && isPerenualEnabled()) {
      const external = await searchPlants(query);
      const internalIds = new Set(internal.map((s) => s.common_name.toLowerCase()));
      perenualHits = mapPerenualResults(external)
        .filter((s) => !internalIds.has(s.common_name.toLowerCase()))
        .slice(0, Math.max(0, limit - internalHits.length))
        .map((s) => ({
          ...s,
          resultSource: "perenual" as const,
          externalId: s.id,
        }));
    }

    const results = [...internalHits, ...perenualHits].slice(0, limit);
    const response: PlantSearchResponse = {
      results,
      sources: {
        plantpal: internalHits.length,
        perenual: perenualHits.length,
      },
    };

    return NextResponse.json({ ok: true, data: response });
  } catch (e) {
    console.error("[api/plants/search]", e);
    return NextResponse.json({ ok: false, error: "Plant search failed" }, { status: 500 });
  }
}
