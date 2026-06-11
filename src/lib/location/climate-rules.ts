import type { Plant } from "@/lib/types";
import type { WeatherAlert, WeatherSnapshot } from "@/lib/types/phase6";
import type { LocationProfile, PlantLocalRecommendation, PlantLocalRisk } from "@/lib/types/location";
import type { PlantTask, TaskPriority, TaskType } from "@/lib/types/tasks";
import { lookupZipRecord } from "./usda-zones";

type Season = "spring" | "summer" | "fall" | "winter";

function currentSeason(month: number): Season {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

function plantMatches(name: string, species: string, keywords: string[]): boolean {
  const hay = `${name} ${species}`.toLowerCase();
  return keywords.some((k) => hay.includes(k));
}

export function getGrowingSeasonLabel(profile: LocationProfile): string {
  if (profile.climateType === "Mediterranean") {
    return "Year-round with peak growth Mar–Nov";
  }
  if (profile.climateType === "Marine") {
    return "Apr–Oct primary; mild winter dormancy";
  }
  if (profile.climateType === "Desert") {
    return "Mar–May & Sep–Nov; summer stress period";
  }
  if (profile.climateType === "Tropical") {
    return "Year-round; watch summer humidity";
  }
  return "Apr–Sep primary growing season";
}

export function getLocalWarnings(profile: LocationProfile): string[] {
  const warnings: string[] = [];
  if (profile.heatRisk === "high") {
    warnings.push("Hot dry stretches. Deep water trees and check potted plants daily.");
  }
  if (profile.droughtRisk === "high") {
    warnings.push("Drought-prone area. Mulch and avoid shallow watering.");
  }
  if (profile.frostRisk === "moderate" || profile.frostRisk === "high") {
    warnings.push("Frost possible. Protect citrus, avocado, and tropicals on cold nights.");
  }
  if (profile.climateType === "Mediterranean") {
    warnings.push("Santa Ana winds and summer heat can dry soil faster than expected.");
  }
  if (profile.climateType === "Marine") {
    warnings.push("Cool wet springs. Watch for root rot in heavy soil.");
  }
  return warnings.slice(0, 4);
}

/** Pasadena-style summer / winter task lists keyed by climate + season. */
export function getLocalSeasonalTasks(
  profile: LocationProfile,
  season?: Season
): string[] {
  const s = season ?? currentSeason(new Date().getMonth());
  const isPasadenaLike =
    profile.climateType === "Mediterranean" && profile.heatRisk === "high";

  if (isPasadenaLike && s === "summer") {
    return [
      "Deep water citrus and fruit trees",
      "Protect young avocado from afternoon heat",
      "Check for spider mites on stressed plants",
      "Mulch fruit trees to retain moisture",
      "Avoid heavy pruning during heat waves",
    ];
  }
  if (isPasadenaLike && s === "winter") {
    return [
      "Reduce watering frequency",
      "Prune deciduous trees while dormant",
      "Protect frost-sensitive tropicals on cold nights",
      "Inspect drainage after winter rains",
    ];
  }
  if (profile.climateType === "Marine" && s === "summer") {
    return [
      "Water containers before dry spells",
      "Watch for powdery mildew in humid weeks",
      "Light feed after spring flush",
    ];
  }
  if (profile.frostRisk === "high" && (s === "fall" || s === "winter")) {
    return [
      "Move tender pots indoors before first frost",
      "Wrap or cover marginally hardy shrubs",
      "Stop fertilizing as growth slows",
    ];
  }
  if (profile.heatRisk === "high" && s === "summer") {
    return [
      "Deep water in early morning",
      "Provide afternoon shade for young plants",
      "Hold off fertilizer until heat breaks",
    ];
  }
  return [
    "Walk the garden and note plants under stress",
    "Adjust watering to match current weather",
    "Scout for pests on new growth",
  ];
}

export function getCareAdjustments(
  profile: LocationProfile,
  weather: WeatherSnapshot
): string[] {
  const adjustments: string[] = [];
  for (const alert of weather.alerts) {
    if (alert.type === "heat") {
      adjustments.push("Increase watering depth. Shallow drinks won't reach roots in heat.");
      adjustments.push("Avoid fertilizing heat-stressed plants this week.");
    }
    if (alert.type === "frost") {
      adjustments.push("Cover or move frost-sensitive plants before overnight lows.");
    }
    if (alert.type === "wind") {
      adjustments.push("Delay pruning until winds calm. Fresh cuts desiccate fast.");
    }
    if (alert.type === "rain") {
      adjustments.push("Skip scheduled watering. Let rain do the work, then check drainage.");
    }
  }
  if (profile.droughtRisk === "high" && !adjustments.length) {
    adjustments.push("Dry climate. Favor deep, less frequent watering over daily sprinkles.");
  }
  return [...new Set(adjustments)].slice(0, 4);
}

export function buildHeadline(
  profile: LocationProfile,
  weather: WeatherSnapshot,
  plants: Plant[]
): string {
  const city = profile.city;
  const heat = weather.alerts.some((a) => a.type === "heat");
  const frost = weather.alerts.some((a) => a.type === "frost");

  const sensitive = plants.filter((p) =>
    plantMatches(p.name, p.species, ["citrus", "lemon", "avocado", "bougainvillea", "tropical"])
  );
  const names =
    sensitive.length > 0
      ? sensitive
          .slice(0, 3)
          .map((p) => p.name)
          .join(", ")
      : "your outdoor plants";

  if (heat) {
    return `${city} is entering a hot dry stretch. ${names} may need deeper watering this week.`;
  }
  if (frost) {
    return `Cold nights ahead in ${city}. Protect ${names} and any potted tropicals.`;
  }
  if (profile.climateType === "Mediterranean") {
    return `${city} (${profile.usdaZone}): Mediterranean climate. Match watering to heat, not the calendar.`;
  }
  return `Because you garden in ${city}, adjust care to ${profile.climateType.toLowerCase()} conditions this season.`;
}

export function getPlantRecommendations(
  profile: LocationProfile,
  weather: WeatherSnapshot,
  plants: Plant[]
): PlantLocalRecommendation[] {
  if (plants.length === 0) {
    return [
      {
        plantName: "Your garden",
        message: `Zone ${profile.usdaZone}. Add plants to get tailored local care tips.`,
        confidence: "medium",
      },
    ];
  }

  return plants.slice(0, 5).map((plant) => {
    const heat = weather.alerts.some((a) => a.type === "heat");
    const frost = weather.alerts.some((a) => a.type === "frost");
    const isCitrus = plantMatches(plant.name, plant.species, ["citrus", "lemon", "orange"]);
    const isAvocado = plantMatches(plant.name, plant.species, ["avocado"]);
    const isTropical = plantMatches(plant.name, plant.species, ["bougainvillea", "tropical", "ficus"]);

    if (heat && (isCitrus || isAvocado)) {
      return {
        plantName: plant.name,
        message: "Likely needs deep watering 2–3× this week. Soak until water runs from drainage holes.",
        confidence: "high" as const,
      };
    }
    if (frost && (isCitrus || isAvocado || isTropical)) {
      return {
        plantName: plant.name,
        message: "Frost-sensitive. Cover or move pots in before overnight lows.",
        confidence: "high" as const,
      };
    }
    if (profile.droughtRisk === "high" && plant.locationType === "outdoor") {
      return {
        plantName: plant.name,
        message: "Dry climate. Mulch base and water deeply, not daily sprinkles.",
        confidence: "medium" as const,
      };
    }
    return {
      plantName: plant.name,
      message: "On track. Check soil moisture before watering today.",
      confidence: "low" as const,
    };
  });
}

export function getPlantRisks(
  profile: LocationProfile,
  weather: WeatherSnapshot,
  plants: Plant[]
): PlantLocalRisk[] {
  const risks: PlantLocalRisk[] = [];
  const frost = weather.alerts.some((a) => a.type === "frost");
  const heat = weather.alerts.some((a) => a.type === "heat");

  for (const plant of plants) {
    if (frost && plantMatches(plant.name, plant.species, ["citrus", "avocado", "bougainvillea"])) {
      risks.push({ plantName: plant.name, risk: "Frost damage on tender growth" });
    }
    if (heat && plant.plantingType === "pot" && plant.locationType === "outdoor") {
      risks.push({ plantName: plant.name, risk: "Root zone overheating in dark pots" });
    }
    if (profile.droughtRisk === "high" && plantMatches(plant.name, plant.species, ["maple", "azalea"])) {
      risks.push({ plantName: plant.name, risk: "Heat stress without deep watering" });
    }
  }
  return risks.slice(0, 5);
}

function makeWeatherTask(
  partial: Omit<PlantTask, "status" | "completedAt">
): PlantTask {
  return { status: "pending", completedAt: null, ...partial };
}

/** Weather-aware tasks per Phase 12 spec. */
export function generateWeatherAwareTasks(
  weather: WeatherSnapshot,
  plants: Plant[],
  profile: LocationProfile,
  todayStr: string
): PlantTask[] {
  const tasks: PlantTask[] = [];
  let taskIdx = 0;

  const hasHeat = weather.alerts.some((a) => a.type === "heat");
  const hasFrost = weather.alerts.some((a) => a.type === "frost");
  const hasWind = weather.alerts.some((a) => a.type === "wind");
  const hasRain = weather.alerts.some((a) => a.type === "rain");
  const hasHumidity = weather.alerts.some((a) => a.type === "humidity");

  if (hasHeat) {
    tasks.push(
      makeWeatherTask({
        id: `climate-heat-deep-${todayStr}`,
        plantId: null,
        plantName: "Garden",
        title: "Deep water young trees",
        description: "Heat alert: soak root zones early morning before the hottest day.",
        taskType: "water",
        priority: "urgent",
        dueDate: todayStr,
        source: "weather",
        whyItMatters: "Heat dries soil faster than usual. Deep water prevents stress and leaf drop.",
      })
    );

    // One garden-level pot check when relevant. Per-plant heat watering is NOT
    // duplicated here — the core schedule already bumps water priority to
    // urgent during heat alerts, and stacking extra tasks just creates noise.
    if (plants.some((p) => p.plantingType === "pot")) {
      tasks.push(
        makeWeatherTask({
          id: `climate-heat-pots-${todayStr}`,
          plantId: null,
          plantName: "Garden",
          title: "Check all potted plants",
          description: "Containers heat up quickly. Soil may dry in one day.",
          taskType: "inspect",
          priority: "high",
          dueDate: todayStr,
          source: "weather",
          whyItMatters: "Pots lack ground insulation. They're first to stress in heat waves.",
        })
      );
    }
  }

  if (hasFrost) {
    tasks.push(
      makeWeatherTask({
        id: `climate-frost-protect-${todayStr}`,
        plantId: null,
        plantName: "Garden",
        title: "Protect frost-sensitive plants",
        description: "Cover citrus, bougainvillea, avocado, and tropicals overnight.",
        taskType: "inspect",
        priority: "urgent",
        dueDate: todayStr,
        source: "weather",
        whyItMatters: "A single frost night can damage years of growth on tender plants.",
      })
    );

    for (const plant of plants.filter((p) => p.plantingType === "pot")) {
      tasks.push(
        makeWeatherTask({
          id: `climate-frost-pot-${plant.id}-${todayStr}`,
          plantId: plant.id,
          plantName: plant.name,
          title: `Bring ${plant.name} inside or cover`,
          description: "Frost alert: potted plants have exposed roots.",
          taskType: "inspect",
          priority: "high",
          dueDate: todayStr,
          source: "weather",
          whyItMatters: "Containers don't buffer cold like in-ground soil.",
        })
      );
    }
  }

  if (hasWind) {
    tasks.push(
      makeWeatherTask({
        id: `climate-wind-stakes-${todayStr}`,
        plantId: null,
        plantName: "Garden",
        title: "Check stakes and ties",
        description: "Wind advisory: secure young trees and tall plants.",
        taskType: "inspect",
        priority: "high",
        dueDate: todayStr,
        source: "weather",
        whyItMatters: "Wind can snap young trunks or loosen root balls.",
      })
    );

    tasks.push(
      makeWeatherTask({
        id: `climate-wind-prune-${todayStr}`,
        plantId: null,
        plantName: "Garden",
        title: "Delay pruning until winds calm",
        description: "Fresh cuts lose moisture quickly in windy conditions.",
        taskType: "prune",
        priority: "low",
        dueDate: todayStr,
        source: "weather",
        whyItMatters: "Pruning during wind increases desiccation and recovery time.",
      })
    );
  }

  if (hasRain) {
    tasks.push(
      makeWeatherTask({
        id: `climate-rain-skip-${todayStr}`,
        plantId: null,
        plantName: "Garden",
        title: "Skip watering today",
        description: "Rain expected. Let nature water and check back tomorrow.",
        taskType: "water",
        priority: "medium",
        dueDate: todayStr,
        source: "weather",
        whyItMatters: "Overwatering after rain is a common cause of root issues.",
      })
    );

    tasks.push(
      makeWeatherTask({
        id: `climate-rain-drain-${todayStr}`,
        plantId: null,
        plantName: "Garden",
        title: "Check drainage after rain",
        description: "Standing water invites root rot and fungus.",
        taskType: "inspect",
        priority: "medium",
        dueDate: todayStr,
        source: "weather",
        whyItMatters: "Good drainage matters most when it rains heavily.",
      })
    );

    tasks.push(
      makeWeatherTask({
        id: `climate-rain-fungus-${todayStr}`,
        plantId: null,
        plantName: "Garden",
        title: "Watch for fungus after wet weather",
        description: "Humid periods favor leaf spot and mildew. Scout leaves.",
        taskType: "scan",
        priority: "low",
        dueDate: todayStr,
        source: "weather",
        whyItMatters: "Catching fungal issues early limits spread.",
      })
    );
  }

  if (hasHumidity) {
    tasks.push(
      makeWeatherTask({
        id: `climate-humidity-fungus-${todayStr}`,
        plantId: null,
        plantName: "Garden",
        title: "Scout for fungus in humid weather",
        description: "High humidity favors mildew and leaf spot. Check dense foliage and improve airflow.",
        taskType: "scan",
        priority: "medium",
        dueDate: todayStr,
        source: "weather",
        whyItMatters: "Fungal issues spread quickly when leaves stay wet and air is stagnant.",
      })
    );
  }

  if (!hasHeat && !hasFrost && !hasWind && !hasRain && !hasHumidity) {
    weather.alerts.forEach((alert: WeatherAlert) => {
      tasks.push(
        makeWeatherTask({
          id: `weather-${alert.type}-${todayStr}-${taskIdx++}`,
          plantId: null,
          plantName: "Garden",
          title: alert.title,
          description: alert.wateringAdjustment || alert.message,
          taskType: alertTypeToTask(alert.type),
          priority: alert.severity === "critical" ? "urgent" : "high",
          dueDate: todayStr,
          source: "weather",
          whyItMatters: alert.message,
        })
      );
    });
  }

  // One rotating seasonal tip per day — gentle local guidance, not a wall of
  // chores. The full list lives on the seasonal page.
  const seasonal = getLocalSeasonalTasks(profile);
  if (seasonal.length > 0) {
    const dayOfYear = Math.floor(
      (Date.parse(todayStr) - Date.parse(`${todayStr.slice(0, 4)}-01-01`)) / 86_400_000
    );
    const title = seasonal[dayOfYear % seasonal.length];
    tasks.push(
      makeWeatherTask({
        id: `local-seasonal-${todayStr}`,
        plantId: null,
        plantName: profile.city,
        title,
        description: `Local seasonal care for ${profile.climateType} climate.`,
        taskType: inferTaskType(title),
        priority: "medium",
        dueDate: todayStr,
        source: "seasonal",
        whyItMatters: `Tailored to ${profile.city} (${profile.usdaZone}) this season.`,
      })
    );
  }

  return tasks;
}

function alertTypeToTask(type: WeatherAlert["type"]): TaskType {
  const map: Record<WeatherAlert["type"], TaskType> = {
    heat: "water",
    frost: "inspect",
    wind: "inspect",
    rain: "water",
    humidity: "scan",
    drought: "water",
  };
  return map[type];
}

function inferTaskType(title: string): TaskType {
  const lower = title.toLowerCase();
  if (lower.includes("water")) return "water";
  if (lower.includes("prun")) return "prune";
  if (lower.includes("mulch") || lower.includes("fertil")) return "fertilize";
  if (lower.includes("mite") || lower.includes("inspect") || lower.includes("protect")) return "inspect";
  return "inspect";
}

/** Infer hardiness zone string from ZIP. */
export function inferHardinessZone(zipCode: string): string {
  return lookupZipRecord(zipCode).usdaZone;
}
