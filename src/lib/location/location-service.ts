import type { Plant } from "@/lib/types";
import type { WeatherSnapshot } from "@/lib/types/phase6";
import type { LocalInsights, LocationProfile } from "@/lib/types/location";
import { fetchWeatherForZip } from "@/lib/integrations/weather";
import { lookupZipRecord } from "./usda-zones";
import {
  buildHeadline,
  getCareAdjustments,
  getGrowingSeasonLabel,
  getLocalSeasonalTasks,
  getLocalWarnings,
  getPlantRecommendations,
  getPlantRisks,
  inferHardinessZone,
} from "./climate-rules";

export { inferHardinessZone };

export function getLocationProfile(zipCode: string): LocationProfile {
  const zip = zipCode.trim().slice(0, 5) || "91107";
  const record = lookupZipRecord(zip);

  return {
    zipCode: zip,
    city: record.city,
    state: record.state,
    usdaZone: record.usdaZone,
    climateType: record.climateType,
    growingSeason: getGrowingSeasonLabel({
      zipCode: zip,
      city: record.city,
      state: record.state,
      usdaZone: record.usdaZone,
      climateType: record.climateType,
      growingSeason: "",
      frostRisk: record.frostRisk,
      heatRisk: record.heatRisk,
      droughtRisk: record.droughtRisk,
      localWarnings: [],
    }),
    frostRisk: record.frostRisk,
    heatRisk: record.heatRisk,
    droughtRisk: record.droughtRisk,
    localWarnings: getLocalWarnings({
      zipCode: zip,
      city: record.city,
      state: record.state,
      usdaZone: record.usdaZone,
      climateType: record.climateType,
      growingSeason: "",
      frostRisk: record.frostRisk,
      heatRisk: record.heatRisk,
      droughtRisk: record.droughtRisk,
      localWarnings: [],
    }),
  };
}

export async function getLocalInsights(
  zipCode: string,
  plants: Plant[] = []
): Promise<LocalInsights> {
  const profile = getLocationProfile(zipCode);
  const weather = await fetchWeatherForZip(zipCode);

  return {
    profile,
    weather,
    headline: buildHeadline(profile, weather, plants),
    plantRecommendations: getPlantRecommendations(profile, weather, plants),
    careAdjustments: getCareAdjustments(profile, weather),
    seasonalTasks: getLocalSeasonalTasks(profile),
    plantRisks: getPlantRisks(profile, weather, plants),
  };
}

/** Sync helper when weather is already loaded. */
export function buildLocalInsights(
  zipCode: string,
  weather: WeatherSnapshot,
  plants: Plant[] = []
): LocalInsights {
  const profile = getLocationProfile(zipCode);
  return {
    profile,
    weather,
    headline: buildHeadline(profile, weather, plants),
    plantRecommendations: getPlantRecommendations(profile, weather, plants),
    careAdjustments: getCareAdjustments(profile, weather),
    seasonalTasks: getLocalSeasonalTasks(profile),
    plantRisks: getPlantRisks(profile, weather, plants),
  };
}
