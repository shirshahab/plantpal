/**
 * Builds a full SpeciesSelection (image, facts, base care) from a search hit.
 * Used by the add-plant flow when a user picks a plant from autocomplete/search.
 */
import type { PlantSearchHit } from "@/lib/types/integrations";
import type { SpeciesCareInput, SpeciesCareSource } from "@/lib/types";
import {
  fetchPlantDetailsApi,
  importPlantSpecies,
} from "@/lib/integrations/client";
import {
  buildBaseCareFromSpecies,
  type NormalizedCareGuide,
} from "./species-care";

export interface SpeciesSelection {
  /** plant_species UUID when available (persisted as plant_species_id). */
  speciesId: string | null;
  commonName: string;
  scientificName: string;
  plantType: string;
  sunlight: string;
  watering: string;
  soilPreference: string;
  hardinessZoneMin: number | null;
  hardinessZoneMax: number | null;
  careSummary: string;
  imageUrl: string | null;
  toxicity: string;
  baseCare: SpeciesCareInput;
  dataSource: SpeciesCareSource;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(id: string | null | undefined): boolean {
  return !!id && UUID_RE.test(id);
}

function normalizeCareGuide(
  guide: Record<string, unknown> | null
): NormalizedCareGuide | null {
  if (!guide) return null;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
  return {
    // PlantPal guide fields, falling back to Perenual guide fields
    watering: str(guide.watering_guide) ?? str(guide.watering),
    fertilizer: str(guide.fertilizer_guide),
    pruning: str(guide.pruning_guide) ?? str(guide.pruning),
  };
}

function sourceForHit(hit: PlantSearchHit): SpeciesCareSource {
  switch (hit.resultSource) {
    case "perenual":
      return "perenual";
    case "ai":
      return "ai";
    case "mock":
      return "fallback";
    default:
      return "plantpal";
  }
}

/** Build selection from the hit alone — no network calls. */
function selectionFromHit(hit: PlantSearchHit): SpeciesSelection {
  const source = sourceForHit(hit);
  return {
    speciesId: isUuid(hit.id) ? hit.id : null,
    commonName: hit.common_name,
    scientificName: hit.scientific_name,
    plantType: hit.type ?? "",
    sunlight: hit.sunlight ?? "",
    watering: hit.watering ?? "",
    soilPreference: hit.soil_preference ?? "",
    hardinessZoneMin: hit.hardiness_zone_min ?? null,
    hardinessZoneMax: hit.hardiness_zone_max ?? null,
    careSummary: hit.description ?? "",
    imageUrl: hit.image_url || null,
    toxicity: hit.toxicity ?? "",
    baseCare: buildBaseCareFromSpecies(hit, null, source),
    dataSource: source,
  };
}

/**
 * Resolve a search hit into a full selection:
 * - Perenual hits are imported into plant_species (for a UUID) and enriched
 *   with the Perenual care guide.
 * - PlantPal hits are enriched with the database care guide.
 * - AI/fallback hits use the hit data directly.
 */
export async function buildSpeciesSelection(
  hit: PlantSearchHit
): Promise<SpeciesSelection> {
  const base = selectionFromHit(hit);

  try {
    if (hit.resultSource === "perenual") {
      const [imported, details] = await Promise.all([
        importPlantSpecies(hit.id),
        fetchPlantDetailsApi(hit.externalId ?? hit.id),
      ]);
      const species = details?.species ?? hit;
      return {
        ...base,
        speciesId: imported && isUuid(imported.id) ? imported.id : base.speciesId,
        careSummary:
          (typeof species.description === "string" && species.description) ||
          base.careSummary,
        toxicity:
          (typeof species.toxicity === "string" && species.toxicity) ||
          base.toxicity,
        hardinessZoneMin: species.hardiness_zone_min ?? base.hardinessZoneMin,
        hardinessZoneMax: species.hardiness_zone_max ?? base.hardinessZoneMax,
        imageUrl: species.image_url || base.imageUrl,
        baseCare: buildBaseCareFromSpecies(
          species,
          normalizeCareGuide(details?.careGuide ?? null),
          "perenual"
        ),
        dataSource: "perenual",
      };
    }

    if (hit.resultSource === "plantpal" || hit.resultSource === "mock") {
      const details = await fetchPlantDetailsApi(hit.id);
      if (details) {
        const source: SpeciesCareSource =
          hit.resultSource === "mock" ? "fallback" : "plantpal";
        return {
          ...base,
          baseCare: buildBaseCareFromSpecies(
            details.species,
            normalizeCareGuide(details.careGuide),
            source
          ),
        };
      }
    }
  } catch {
    // network failure — fall back to hit-only selection
  }

  return base;
}
