import type { PlantSpecies } from "@/lib/knowledge/types";
import type { LocalMatchCheck, SuitabilityResult } from "@/lib/types/location";
import type { LocationType, PlantingType, SunExposure } from "@/lib/types";
import { lookupZipRecord } from "./usda-zones";
import { searchPlantSpecies } from "@/lib/knowledge";

export interface SuitabilityInput {
  zipCode: string;
  sunExposure?: SunExposure;
  locationType?: LocationType;
  plantingType?: PlantingType;
  experienceLevel?: "beginner" | "intermediate" | "advanced";
}

function scoreLabel(score: number): SuitabilityResult["label"] {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

function sunScore(speciesSun: string, exposure?: SunExposure): number {
  if (!exposure) return 15;
  const s = speciesSun.toLowerCase();
  if (exposure === "full_sun" && s.includes("full")) return 20;
  if (exposure === "partial_sun" && (s.includes("partial") || s.includes("full"))) return 18;
  if (exposure === "shade" && s.includes("shade")) return 20;
  if (s.includes("partial")) return 14;
  return 10;
}

export function calculateSuitabilityScore(
  species: PlantSpecies,
  input: SuitabilityInput
): SuitabilityResult {
  const record = lookupZipRecord(input.zipCode);
  const userZone = record.zoneNumber;
  const zoneMin = species.hardiness_zone_min;
  const zoneMax = species.hardiness_zone_max;

  let zoneMatch = 0;
  if (userZone >= zoneMin && userZone <= zoneMax) zoneMatch = 40;
  else if (userZone === zoneMin - 1 || userZone === zoneMax + 1) zoneMatch = 25;
  else if (userZone < zoneMin - 1) zoneMatch = 8;
  else zoneMatch = 15;

  const sunMatch = sunScore(species.sunlight, input.sunExposure);

  let waterClimate = 15;
  if (record.droughtRisk === "high" && species.watering.toLowerCase().includes("moderate")) {
    waterClimate = 18;
  }
  if (record.droughtRisk === "high" && species.watering.toLowerCase().includes("frequent")) {
    waterClimate = 8;
  }
  if (record.climateType === "Marine" && species.watering.toLowerCase().includes("moderate")) {
    waterClimate = 18;
  }

  let weatherRisk = 10;
  if (record.heatRisk === "high" && species.type === "succulent") weatherRisk = 10;
  else if (record.heatRisk === "high" && species.maintenance_level === "High") weatherRisk = 4;
  else if (record.frostRisk === "high" && userZone < zoneMin) weatherRisk = 2;

  let containerFit = 5;
  if (input.plantingType === "pot") {
    if (species.type === "tree" && species.mature_height.includes("30")) containerFit = 1;
    else if (species.type === "herb" || species.type === "succulent") containerFit = 5;
    else containerFit = 3;
  }

  let experienceFit = 5;
  const maint = species.maintenance_level.toLowerCase();
  const exp = input.experienceLevel ?? "beginner";
  if (exp === "beginner" && maint.includes("low")) experienceFit = 5;
  else if (exp === "beginner" && maint.includes("high")) experienceFit = 1;
  else if (exp === "advanced") experienceFit = 5;

  const score = Math.min(
    100,
    Math.round(zoneMatch + sunMatch + waterClimate + weatherRisk + containerFit + experienceFit)
  );

  const city = record.city;
  const summary = `${species.common_name} in ${input.zipCode} (${city}): ${score}/100 — ${scoreLabel(score).toLowerCase()} match for zone ${record.usdaZone}.`;

  return {
    score,
    label: scoreLabel(score),
    summary,
    factors: {
      zoneMatch,
      sunMatch,
      waterClimate,
      weatherRisk,
      containerFit,
      experienceFit,
    },
  };
}

export function getLocalMatchCheck(input: {
  name: string;
  species: string;
  zipCode: string;
  locationType: LocationType;
  plantingType: PlantingType;
  sunExposure?: SunExposure;
}): LocalMatchCheck {
  const hits = searchPlantSpecies({ query: input.name || input.species });
  const species = hits.find(
    (s) =>
      s.common_name.toLowerCase() === input.name.toLowerCase() ||
      s.scientific_name.toLowerCase() === input.species.toLowerCase()
  ) ?? hits[0];

  const record = lookupZipRecord(input.zipCode);
  const tips: string[] = [];

  if (species) {
    const result = calculateSuitabilityScore(species, {
      zipCode: input.zipCode,
      sunExposure: input.sunExposure,
      locationType: input.locationType,
      plantingType: input.plantingType,
    });

    if (input.species.toLowerCase().includes("avocado") || input.name.toLowerCase().includes("avocado")) {
      tips.push("Young avocado trees need heat protection and excellent drainage in hot dry summers.");
    }
    if (record.heatRisk === "high" && input.locationType === "outdoor") {
      tips.push(`${record.city} summers run hot — plan for deep watering, not daily sprinkles.`);
    }
    if (record.frostRisk !== "low" && input.locationType === "outdoor") {
      tips.push("Frost is possible — have a cover plan for cold snaps.");
    }
    if (input.plantingType === "pot" && species.type === "tree") {
      tips.push("Large trees in pots need bigger containers and more frequent water than in-ground.");
    }

    let fitLabel: LocalMatchCheck["fitLabel"] = "Good fit";
    if (result.score >= 85) fitLabel = "Great fit";
    else if (result.score >= 65) fitLabel = "Good fit";
    else if (result.score >= 45) fitLabel = "Caution";
    else fitLabel = "Risky";

    const message =
      fitLabel === "Great fit" || fitLabel === "Good fit"
        ? `This plant is a ${fitLabel.toLowerCase()} for ${record.city}, zone ${record.usdaZone}.`
        : `This plant may struggle in ${record.city} — review zone and sun needs carefully.`;

    return { fitLabel, score: result.score, message, tips };
  }

  tips.push(`Zone ${record.usdaZone} (${record.climateType}) — match watering to local heat and rain.`);
  if (input.species.toLowerCase().includes("avocado")) {
    tips.push("Young avocado trees need heat protection and excellent drainage.");
  }

  return {
    fitLabel: "Good fit",
    score: 72,
    message: `Adding ${input.name || "this plant"} in ${record.city} — we'll tailor care to your local climate.`,
    tips,
  };
}

export function findSpeciesForName(name: string): PlantSpecies | undefined {
  const hits = searchPlantSpecies({ query: name });
  return hits[0];
}

export function formatSuitabilityShort(
  speciesName: string,
  zipCode: string,
  score: number
): string {
  const record = lookupZipRecord(zipCode);
  return `${speciesName} in ${zipCode}: ${score}/100`;
}
