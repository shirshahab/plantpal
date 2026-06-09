import type {
  PlantSpecies,
  PlantSpeciesDetail,
  SpeciesSearchFilters,
  SoilType,
  Fertilizer,
  Pest,
  ReferenceSearchFilters,
} from "./types";
import { enrichPlantSpecies } from "./defaults";
import {
  PLANT_SPECIES,
  SOIL_TYPES,
  FERTILIZERS,
  PESTS,
  DISEASES,
  PLANT_CARE_GUIDES,
  PLANT_SOIL_MATCHES,
  PLANT_FERTILIZER_MATCHES,
  PLANT_PEST_RISKS,
  PLANT_DISEASE_RISKS,
} from "./seed";

function matchesQuery(species: PlantSpecies, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    species.common_name.toLowerCase().includes(q) ||
    species.scientific_name.toLowerCase().includes(q) ||
    species.family.toLowerCase().includes(q)
  );
}

function matchesFilters(species: PlantSpecies, filters: SpeciesSearchFilters): boolean {
  if (filters.type && species.type !== filters.type) return false;
  if (filters.sunlight && !species.sunlight.toLowerCase().includes(filters.sunlight.toLowerCase()))
    return false;
  if (filters.watering && !species.watering.toLowerCase().includes(filters.watering.toLowerCase()))
    return false;
  if (filters.zone !== undefined && filters.zone > 0) {
    if (filters.zone < species.hardiness_zone_min || filters.zone > species.hardiness_zone_max)
      return false;
  }
  return true;
}

export function searchPlantSpecies(filters: SpeciesSearchFilters = {}): PlantSpecies[] {
  return PLANT_SPECIES.filter(
    (s) => matchesQuery(s, filters.query ?? "") && matchesFilters(s, filters)
  ).sort((a, b) => a.common_name.localeCompare(b.common_name));
}

export function getPlantSpeciesById(id: string): PlantSpecies | undefined {
  return PLANT_SPECIES.find((s) => s.id === id);
}

export function getPlantSpeciesDetail(id: string): PlantSpeciesDetail | null {
  const species = getPlantSpeciesById(id);
  if (!species) return null;

  const care_guide = PLANT_CARE_GUIDES.find((g) => g.plant_species_id === id) ?? null;

  const soilIds = new Set(
    PLANT_SOIL_MATCHES.filter((m) => m.plant_species_id === id).map((m) => m.soil_type_id)
  );
  const soils = SOIL_TYPES.filter((s) => soilIds.has(s.id));

  const fertIds = new Set(
    PLANT_FERTILIZER_MATCHES.filter((m) => m.plant_species_id === id).map((m) => m.fertilizer_id)
  );
  const fertilizers = FERTILIZERS.filter((f) => fertIds.has(f.id));

  const pests = PLANT_PEST_RISKS.filter((r) => r.plant_species_id === id).map((r) => {
    const pest = PESTS.find((p) => p.id === r.pest_id)!;
    return { ...pest, risk_level: r.risk_level, notes: r.notes };
  });

  const diseases = PLANT_DISEASE_RISKS.filter((r) => r.plant_species_id === id).map((r) => {
    const disease = DISEASES.find((d) => d.id === r.disease_id)!;
    return { ...disease, risk_level: r.risk_level, notes: r.notes };
  });

  return { ...enrichPlantSpecies(species), care_guide, soils, fertilizers, pests, diseases };
}

export function getSpeciesCount(): number {
  return PLANT_SPECIES.length;
}

function matchesNameQuery(name: string, description: string, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    name.toLowerCase().includes(q) ||
    description.toLowerCase().includes(q)
  );
}

export function searchSoilTypes(filters: ReferenceSearchFilters = {}): SoilType[] {
  return SOIL_TYPES.filter((s) =>
    matchesNameQuery(s.name, `${s.description} ${s.best_for}`, filters.query ?? "")
  ).sort((a, b) => a.name.localeCompare(b.name));
}

export function getSoilById(id: string): SoilType | undefined {
  return SOIL_TYPES.find((s) => s.id === id);
}

export function searchFertilizers(filters: ReferenceSearchFilters = {}): Fertilizer[] {
  return FERTILIZERS.filter((f) =>
    matchesNameQuery(f.name, `${f.description} ${f.best_for} ${f.type}`, filters.query ?? "")
  ).sort((a, b) => a.name.localeCompare(b.name));
}

export function getFertilizerById(id: string): Fertilizer | undefined {
  return FERTILIZERS.find((f) => f.id === id);
}

export function searchPests(filters: ReferenceSearchFilters = {}): Pest[] {
  return PESTS.filter((p) =>
    matchesNameQuery(
      p.name,
      `${p.description} ${p.affected_plants} ${p.signs}`,
      filters.query ?? ""
    )
  ).sort((a, b) => a.name.localeCompare(b.name));
}

export function getPestById(id: string): Pest | undefined {
  return PESTS.find((p) => p.id === id);
}

export function getSoilCount(): number {
  return SOIL_TYPES.length;
}

export function getFertilizerCount(): number {
  return FERTILIZERS.length;
}

export function getPestCount(): number {
  return PESTS.length;
}

export { PLANT_SPECIES, SOIL_TYPES, FERTILIZERS, PESTS, DISEASES };
