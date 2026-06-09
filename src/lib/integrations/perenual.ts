/**
 * Perenual plant database API.
 * Docs: https://perenual.com/docs/api
 */

import type { PlantSpecies, PlantSpeciesType } from "@/lib/knowledge/types";

const BASE = "https://perenual.com/api/v2";

export interface PerenualSearchParams {
  q?: string;
  page?: number;
  indoor?: boolean;
}

export interface PerenualSpeciesSummary {
  id: number;
  common_name: string;
  scientific_name: string[];
  default_image?: { thumbnail?: string; regular_url?: string };
  watering?: string;
  sunlight?: string[];
  cycle?: string;
}

export interface PerenualCareGuide {
  section: string[];
  description: string;
  watering?: string;
  sunlight?: string;
  pruning?: string;
  soil?: string[];
}

function hasPerenualKey(): boolean {
  return Boolean(process.env.PERENUAL_API_KEY?.trim());
}

function mapCycleToType(cycle?: string, indoor?: number): PlantSpeciesType {
  const c = (cycle ?? "").toLowerCase();
  if (indoor === 1) return "indoor";
  if (c.includes("annual")) return "flower";
  if (c.includes("perennial")) return "flower";
  return "shrub";
}

function mapSunlight(sunlight?: string[]): string {
  if (!sunlight?.length) return "Partial sun";
  return sunlight.join(", ");
}

function mapWatering(watering?: string): string {
  if (!watering) return "Moist, well-drained";
  const w = watering.toLowerCase();
  if (w.includes("minimum") || w.includes("none")) return "Dry — allow soil to dry between waterings";
  if (w.includes("average") || w.includes("frequent")) return "Moist — water when top inch is dry";
  return watering;
}

function mapToxicity(poisonous?: number): string {
  if (poisonous === 1) return "Toxic to pets and/or humans if ingested";
  return "Generally non-toxic — verify for your specific variety";
}

export function perenualExternalId(id: number): string {
  return `perenual-${id}`;
}

export function parsePerenualId(speciesId: string): number | null {
  if (!speciesId.startsWith("perenual-")) return null;
  const n = Number.parseInt(speciesId.slice("perenual-".length), 10);
  return Number.isFinite(n) ? n : null;
}

function mapSummaryToSpecies(item: PerenualSpeciesSummary): PlantSpecies {
  return {
    id: perenualExternalId(item.id),
    common_name: item.common_name || "Unknown plant",
    scientific_name: item.scientific_name?.[0] ?? "",
    family: "",
    type: mapCycleToType(item.cycle),
    description: "",
    sunlight: mapSunlight(item.sunlight),
    watering: mapWatering(item.watering),
    soil_preference: "Well-draining potting mix",
    hardiness_zone_min: 4,
    hardiness_zone_max: 11,
    mature_height: "Varies",
    mature_width: "Varies",
    growth_rate: "Moderate",
    toxicity: "Verify toxicity for your variety",
    maintenance_level: "Moderate",
    image_url:
      item.default_image?.regular_url ??
      item.default_image?.thumbnail ??
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
    source: "perenual",
  };
}

export async function searchPlants(
  query: string,
  page = 1
): Promise<PerenualSpeciesSummary[]> {
  const key = process.env.PERENUAL_API_KEY?.trim();
  if (!key || !query.trim()) return [];

  try {
    const url = new URL(`${BASE}/species-list`);
    url.searchParams.set("key", key);
    url.searchParams.set("q", query.trim());
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error("[perenual] search failed:", res.status);
      return [];
    }

    const json = (await res.json()) as { data?: PerenualSpeciesSummary[] };
    return json.data ?? [];
  } catch (e) {
    console.error("[perenual] search error:", e);
    return [];
  }
}

/** @deprecated Use searchPlants */
export const searchPerenual = searchPlants;

export async function getPlantDetails(id: number): Promise<PlantSpecies | null> {
  const key = process.env.PERENUAL_API_KEY?.trim();
  if (!key) return null;

  try {
    const res = await fetch(`${BASE}/species/details/${id}?key=${key}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      console.error("[perenual] details failed:", res.status);
      return null;
    }

    const item = (await res.json()) as Record<string, unknown>;
    const summary: PerenualSpeciesSummary = {
      id,
      common_name: String(item.common_name ?? ""),
      scientific_name: Array.isArray(item.scientific_name)
        ? (item.scientific_name as string[])
        : [],
      default_image: item.default_image as PerenualSpeciesSummary["default_image"],
      watering: String(item.watering ?? ""),
      sunlight: Array.isArray(item.sunlight) ? (item.sunlight as string[]) : [],
      cycle: String(item.cycle ?? ""),
    };

    const species = mapSummaryToSpecies(summary);
    species.description = String(item.description ?? "");
    species.family = String(item.family ?? "");
    species.toxicity = mapToxicity(item.poisonous as number | undefined);

    const hardiness = item.hardiness as { min?: string; max?: string } | undefined;
    if (hardiness?.min) {
      const min = Number.parseInt(hardiness.min.replace(/\D/g, ""), 10);
      if (Number.isFinite(min)) species.hardiness_zone_min = min;
    }
    if (hardiness?.max) {
      const max = Number.parseInt(hardiness.max.replace(/\D/g, ""), 10);
      if (Number.isFinite(max)) species.hardiness_zone_max = max;
    }

    return species;
  } catch (e) {
    console.error("[perenual] details error:", e);
    return null;
  }
}

export async function getPlantCareGuide(id: number): Promise<PerenualCareGuide | null> {
  const key = process.env.PERENUAL_API_KEY?.trim();
  if (!key) return null;

  try {
    const res = await fetch(`${BASE}/species-care-guide-list?species_id=${id}&key=${key}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: Record<string, unknown>[] };
    const guide = json.data?.[0];
    if (!guide) return null;

    return {
      section: Array.isArray(guide.section) ? (guide.section as string[]) : [],
      description: String(guide.description ?? ""),
      watering: guide.watering ? String(guide.watering) : undefined,
      sunlight: guide.sunlight ? String(guide.sunlight) : undefined,
      pruning: guide.pruning ? String(guide.pruning) : undefined,
      soil: Array.isArray(guide.soil) ? (guide.soil as string[]) : undefined,
    };
  } catch (e) {
    console.error("[perenual] care guide error:", e);
    return null;
  }
}

/** @deprecated Use getPlantDetails */
export const getPerenualSpeciesDetail = getPlantDetails;

export function mapPerenualResults(items: PerenualSpeciesSummary[]): PlantSpecies[] {
  return items.map(mapSummaryToSpecies);
}

export function isPerenualEnabled(): boolean {
  return hasPerenualKey();
}
