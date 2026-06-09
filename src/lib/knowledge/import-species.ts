import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getPlantDetails,
  parsePerenualId,
  perenualExternalId,
} from "@/lib/integrations/perenual";
import type { PlantSpecies } from "@/lib/knowledge/types";
import { getPlantSpeciesById } from "@/lib/knowledge/mock-store";

/** Persist a Perenual species into plant_species (or return existing mock id). */
export async function importPerenualSpecies(perenualId: number): Promise<PlantSpecies | null> {
  const species = await getPlantDetails(perenualId);
  if (!species) return null;

  const id = perenualExternalId(perenualId);

  if (!isSupabaseConfigured()) {
    return { ...species, id, source: "perenual" };
  }

  try {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("plant_species")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (existing) return existing as PlantSpecies;

    const { data, error } = await supabase
      .from("plant_species")
      .insert({
        id,
        common_name: species.common_name,
        scientific_name: species.scientific_name,
        family: species.family || "Unknown",
        type: species.type,
        description: species.description || `${species.common_name} care profile from Perenual.`,
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
        source: "perenual",
      })
      .select("*")
      .single();

    if (error) {
      console.error("[import-species] Supabase insert failed:", error.message);
      return { ...species, id, source: "perenual" };
    }

    return data as PlantSpecies;
  } catch (e) {
    console.error("[import-species] error:", e);
    return { ...species, id, source: "perenual" };
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
