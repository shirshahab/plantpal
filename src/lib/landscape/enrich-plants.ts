import type { LandscapePlantListItem, SunExposure as LandscapeSun } from "./types";
import { calculateSuitabilityScore, findSpeciesForName } from "@/lib/location/suitability";
import type { SunExposure } from "@/lib/types";

function toSuitabilitySun(exposure: LandscapeSun): SunExposure | undefined {
  if (exposure === "mixed") return "partial_sun";
  return exposure;
}

export function enrichPlantListWithSuitability(
  plants: LandscapePlantListItem[],
  zipCode: string,
  sunExposure: LandscapeSun
): LandscapePlantListItem[] {
  return plants.map((item) => {
    const species = findSpeciesForName(item.name);
    if (!species) return item;
    const result = calculateSuitabilityScore(species, {
      zipCode,
      sunExposure: toSuitabilitySun(sunExposure),
    });
    return {
      ...item,
      suitability_score: result.score,
      suitability_label: result.label,
    };
  });
}
