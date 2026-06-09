import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  PlantSpecies,
  PlantSpeciesDetail,
  SpeciesSearchFilters,
} from "./types";
import * as mock from "./mock-store";

export async function searchPlantSpecies(
  filters: SpeciesSearchFilters = {}
): Promise<PlantSpecies[]> {
  if (!isSupabaseConfigured()) {
    return mock.searchPlantSpecies(filters);
  }

  try {
    const supabase = await createClient();
    let query = supabase.from("plant_species").select("*");

    if (filters.query?.trim()) {
      const q = `%${filters.query.trim()}%`;
      query = query.or(`common_name.ilike.${q},scientific_name.ilike.${q}`);
    }
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.zone && filters.zone > 0) {
      query = query
        .lte("hardiness_zone_min", filters.zone)
        .gte("hardiness_zone_max", filters.zone);
    }

    const { data, error } = await query.order("common_name");
    if (error || !data?.length) return mock.searchPlantSpecies(filters);
    return data as PlantSpecies[];
  } catch {
    return mock.searchPlantSpecies(filters);
  }
}

export async function getPlantSpeciesDetail(id: string): Promise<PlantSpeciesDetail | null> {
  if (!isSupabaseConfigured()) {
    return mock.getPlantSpeciesDetail(id);
  }

  try {
    const supabase = await createClient();
    const { data: species, error } = await supabase
      .from("plant_species")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !species) return mock.getPlantSpeciesDetail(id);

    const [careRes, soilRes, fertRes, pestRes, disRes] = await Promise.all([
      supabase.from("plant_care_guides").select("*").eq("plant_species_id", id).maybeSingle(),
      supabase
        .from("plant_soil_matches")
        .select("soil_types(*)")
        .eq("plant_species_id", id),
      supabase
        .from("plant_fertilizer_matches")
        .select("fertilizers(*)")
        .eq("plant_species_id", id),
      supabase
        .from("plant_pest_risks")
        .select("risk_level, notes, pests(*)")
        .eq("plant_species_id", id),
      supabase
        .from("plant_disease_risks")
        .select("risk_level, notes, diseases(*)")
        .eq("plant_species_id", id),
    ]);

    return {
      ...(species as PlantSpecies),
      care_guide: careRes.data ?? null,
      soils: (soilRes.data ?? []).map((r: { soil_types: unknown }) => r.soil_types).filter(Boolean),
      fertilizers: (fertRes.data ?? [])
        .map((r: { fertilizers: unknown }) => r.fertilizers)
        .filter(Boolean),
      pests: (pestRes.data ?? []).map((r: Record<string, unknown>) => ({
        ...(r.pests as Record<string, unknown>),
        risk_level: r.risk_level as string,
        notes: r.notes as string | undefined,
      })),
      diseases: (disRes.data ?? []).map((r: Record<string, unknown>) => ({
        ...(r.diseases as Record<string, unknown>),
        risk_level: r.risk_level as string,
        notes: r.notes as string | undefined,
      })),
    } as PlantSpeciesDetail;
  } catch {
    return mock.getPlantSpeciesDetail(id);
  }
}

export { getSpeciesCount } from "./mock-store";
