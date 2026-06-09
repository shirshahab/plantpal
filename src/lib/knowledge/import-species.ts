import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getPlantDetails,
  parsePerenualId,
  perenualExternalId,
} from "@/lib/integrations/perenual";
import { recordDataSource, recordDataSourceError } from "@/lib/data-sources/runtime";
import type { PlantSpecies } from "@/lib/knowledge/types";
import { getPlantSpeciesById } from "@/lib/knowledge/mock-store";

function normalizeScientific(name: string): string {
  return name.trim().toLowerCase();
}

/** Persist a Perenual species into plant_species (dedupe by scientific_name). */
export async function importPerenualSpecies(perenualId: number): Promise<PlantSpecies | null> {
  const species = await getPlantDetails(perenualId);
  if (!species) {
    recordDataSourceError("perenual", "Could not fetch plant details");
    return null;
  }

  const externalId = perenualExternalId(perenualId);
  const normalized = {
    common_name: species.common_name.trim(),
    scientific_name: species.scientific_name.trim(),
    family: species.family?.trim() || "Unknown",
    type: species.type,
    description:
      species.description?.trim() ||
      `${species.common_name} care profile from Perenual.`,
    sunlight: species.sunlight,
    watering: species.watering,
    soil_preference: species.soil_preference,
    hardiness_zone_min: species.hardiness_zone_min,
    hardiness_zone_max: species.hardiness_zone_max,
    mature_height: species.mature_height,
    mature_width: species.mature_width,
    growth_rate: species.growth_rate,
    toxicity: species.toxicity,
    maintenance_level: species.maintenance_level,
    image_url: species.image_url,
    source: "perenual" as const,
  };

  if (!isSupabaseConfigured()) {
    recordDataSource("perenual", "real_api");
    return { ...species, ...normalized, id: externalId };
  }

  try {
    const supabase = await createClient();

    if (normalized.scientific_name) {
      const { data: byScientific } = await supabase
        .from("plant_species")
        .select("*")
        .ilike("scientific_name", normalized.scientific_name)
        .maybeSingle();

      if (byScientific) {
        recordDataSource("supabase", "supabase");
        return byScientific as PlantSpecies;
      }
    }

    const { data: byCommon } = await supabase
      .from("plant_species")
      .select("*")
      .ilike("common_name", normalized.common_name)
      .eq("source", "perenual")
      .maybeSingle();

    if (byCommon) {
      recordDataSource("supabase", "supabase");
      return byCommon as PlantSpecies;
    }

    const { data, error } = await supabase
      .from("plant_species")
      .insert(normalized)
      .select("*")
      .single();

    if (error) {
      console.error("[import-species] Supabase insert failed:", error.message);
      recordDataSourceError("supabase", error.message);
      recordDataSource("perenual", "real_api", { fallback: true });
      return { ...species, ...normalized, id: externalId };
    }

    recordDataSource("supabase", "supabase");
    recordDataSource("perenual", "real_api");
    return data as PlantSpecies;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Import failed";
    console.error("[import-species] error:", e);
    recordDataSourceError("supabase", msg);
    return { ...species, ...normalized, id: externalId };
  }
}

export async function resolveSpeciesId(speciesId: string): Promise<PlantSpecies | null> {
  const perenualId = parsePerenualId(speciesId);
  if (perenualId !== null) {
    return importPerenualSpecies(perenualId);
  }

  const local = getPlantSpeciesById(speciesId);
  if (local) return local;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("plant_species")
        .select("*")
        .eq("id", speciesId)
        .maybeSingle();
      if (data) return data as PlantSpecies;
    } catch {
      /* fallback */
    }
  }

  return null;
}
