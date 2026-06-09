import type {
  BloomStage,
  DormancyStatus,
  FruitStage,
  GenomeComputeInput,
  LifeStage,
  PlantGenomeState,
  PlantGenomeTrend,
  TrendDirection,
} from "./types";
import { resolveSpeciesBaseline } from "./species-baseline";
import { buildForecasts } from "./forecast";

const GENOME_VERSION = 1;

function daysBetween(a: string, b: Date = new Date()): number {
  return Math.max(0, Math.floor((b.getTime() - new Date(a).getTime()) / 86400000));
}

function formatAgeLabel(days: number): string {
  if (days < 14) return `${days} days old`;
  if (days < 60) return `${Math.round(days / 7)} weeks old`;
  if (days < 365) return `${Math.round(days / 30)} months old`;
  const years = Math.floor(days / 365);
  const months = Math.round((days % 365) / 30);
  return months > 0 ? `${years}y ${months}mo old` : `${years} year${years > 1 ? "s" : ""} old`;
}

function inferLifeStage(ageDays: number, baseline: ReturnType<typeof resolveSpeciesBaseline>): LifeStage {
  const rate = baseline.growthRate;
  const seedlingMax = rate === "fast" ? 90 : rate === "moderate" ? 120 : 180;
  const juvenileMax = rate === "fast" ? 365 : rate === "moderate" ? 730 : 1095;

  if (ageDays < seedlingMax) return "seedling";
  if (ageDays < juvenileMax) return "juvenile";
  if (ageDays < juvenileMax * 2) return "establishing";
  if (ageDays < juvenileMax * 5) return "mature";
  return "senescent";
}

function computeGrowthTrend(
  heights: number[],
  entryCount: number,
  ageDays: number,
  baseline: ReturnType<typeof resolveSpeciesBaseline>
): PlantGenomeTrend {
  if (heights.length >= 2) {
    const recent = heights.slice(0, Math.min(3, heights.length));
    const delta = recent[0] - recent[recent.length - 1];
    const direction: TrendDirection =
      delta > 1 ? "rising" : delta < -0.5 ? "declining" : "stable";
    return {
      direction,
      label: direction === "rising" ? "Growing" : direction === "declining" ? "Stalled" : "Steady",
      detail:
        delta > 0
          ? `+${delta.toFixed(1)}" across recent measurements`
          : entryCount >= 2
            ? "Height stable — consider a new measurement"
            : "Tracking from photos",
      score: Math.min(100, 40 + Math.abs(delta) * 4 + entryCount * 5),
    };
  }

  const expectedRate = baseline.growthRate === "fast" ? 0.15 : baseline.growthRate === "moderate" ? 0.08 : 0.04;
  const inferred = ageDays * expectedRate;
  return {
    direction: entryCount > 0 ? "stable" : "rising",
    label: entryCount > 0 ? "Early data" : "Estimated",
    detail:
      entryCount > 0
        ? "Add height measurements to sharpen growth trend"
        : `~${Math.round(inferred)}" estimated from age and species rate`,
    score: 25 + entryCount * 10 + (entryCount > 0 ? 15 : 0),
  };
}

function computeHealthTrend(
  healthStatus: GenomeComputeInput["healthStatus"],
  healthScanCount: number,
  lastHealthScanAt: string | null,
  tasksCompleted: number,
  lastWateredAt: string | null
): PlantGenomeTrend {
  let score = healthStatus === "healthy" ? 75 : healthStatus === "needs_attention" ? 50 : 25;
  let direction: TrendDirection = "stable";

  if (lastWateredAt) {
    const daysSinceWater = daysBetween(lastWateredAt);
    if (daysSinceWater <= 3) score += 10;
    else if (daysSinceWater > 7) {
      score -= 15;
      direction = "declining";
    }
  }

  if (healthScanCount >= 2 && lastHealthScanAt) {
    score += 10;
    if (healthStatus === "healthy") direction = "rising";
  }

  if (tasksCompleted >= 3 && healthStatus !== "critical") {
    score += 8;
    if (direction === "stable" && healthStatus === "healthy") direction = "rising";
  }

  if (healthStatus === "critical") direction = "declining";

  score = Math.max(0, Math.min(100, score));

  return {
    direction,
    label:
      direction === "rising"
        ? "Improving"
        : direction === "declining"
          ? "Declining"
          : healthStatus === "healthy"
            ? "Stable"
            : "Needs watch",
    detail:
      healthStatus === "healthy"
        ? "Health signals look good — keep consistent care"
        : healthStatus === "needs_attention"
          ? "Recent stress detected — recovery window open"
          : "Critical — prioritize watering and diagnosis",
    score,
  };
}

function inferBloomStage(
  month: number,
  baseline: ReturnType<typeof resolveSpeciesBaseline>,
  healthStatus: GenomeComputeInput["healthStatus"]
): BloomStage {
  if (!baseline.isFlowering || baseline.bloomMonths.length === 0) return "none";
  if (!baseline.bloomMonths.includes(month)) {
    const next = baseline.bloomMonths.find((m) => m > month) ?? baseline.bloomMonths[0];
    return next - month <= 2 || (next < month && 12 - month + next <= 2) ? "pre_bloom" : "none";
  }
  if (healthStatus === "critical") return "pre_bloom";
  return "blooming";
}

function inferFruitStage(
  month: number,
  baseline: ReturnType<typeof resolveSpeciesBaseline>,
  plantName: string,
  species: string
): FruitStage {
  if (!baseline.isFruitBearing) return "none";
  const combined = `${plantName} ${species}`.toLowerCase();

  if (baseline.fruitMonths.includes(month)) {
    if (combined.includes("lemon") && month <= 3) return "harvest_ready";
    if (combined.includes("avocado") && month >= 7) return "ripening";
    return "fruit_set";
  }

  const preFruit = baseline.fruitMonths.find((m) => m > month) ?? baseline.fruitMonths[0];
  if (preFruit - month <= 2 || (preFruit < month && 12 - month + preFruit <= 2)) {
    return "pre_fruit";
  }
  return "none";
}

function inferDormancy(
  month: number,
  baseline: ReturnType<typeof resolveSpeciesBaseline>,
  locationType: "indoor" | "outdoor"
): DormancyStatus {
  if (locationType === "indoor") {
    if (baseline.dormantMonths.includes(month)) return "slowing";
    return "active_growth";
  }
  if (baseline.dormantMonths.includes(month)) return "dormant";
  const prev = month === 1 ? 12 : month - 1;
  const next = month === 12 ? 1 : month + 1;
  if (baseline.dormantMonths.includes(prev) || baseline.dormantMonths.includes(next)) {
    return "breaking_dormancy";
  }
  if (baseline.dormantMonths.some((m) => Math.abs(m - month) === 1)) return "slowing";
  return "active_growth";
}

function computeRiskScore(input: GenomeComputeInput, baseline: ReturnType<typeof resolveSpeciesBaseline>): number {
  let risk = 15;

  if (input.healthStatus === "needs_attention") risk += 25;
  if (input.healthStatus === "critical") risk += 45;

  if (input.lastWateredAt) {
    const days = daysBetween(input.lastWateredAt);
    if (days > 7) risk += 20;
    else if (days > 4) risk += 10;
  } else {
    risk += 15;
  }

  if (input.weatherAlerts?.some((a) => a.type === "heat" && a.severity !== "info")) risk += 15;
  if (input.weatherAlerts?.some((a) => a.type === "frost")) risk += 20;
  if (input.tempHighF && input.tempHighF >= 95 && baseline.heatTolerance !== "high") risk += 15;

  if (input.healthScanCount === 0 && input.healthStatus !== "healthy") risk += 10;
  if (input.photoCount === 0) risk += 5;

  return Math.max(0, Math.min(100, Math.round(risk)));
}

function computeRecoveryScore(
  input: GenomeComputeInput,
  healthTrend: PlantGenomeTrend,
  riskScore: number
): number {
  if (input.healthStatus === "healthy" && riskScore < 30) {
    return Math.min(100, 70 + input.tasksCompleted * 2);
  }

  let recovery = 30;
  if (healthTrend.direction === "rising") recovery += 35;
  if (input.tasksCompleted >= 2) recovery += 15;
  if (input.lastHealthScanAt && daysBetween(input.lastHealthScanAt) < 14) recovery += 15;
  if (input.lastWateredAt && daysBetween(input.lastWateredAt) <= 2) recovery += 10;

  return Math.max(0, Math.min(100, Math.round(recovery)));
}

function computeIntelligenceScore(input: GenomeComputeInput, healthTrend: PlantGenomeTrend): number {
  let score = 20;

  score += Math.min(20, input.photoCount * 4);
  score += Math.min(15, input.growthEntryCount * 5);
  score += Math.min(15, input.healthScanCount * 8);
  score += Math.min(15, input.tasksCompleted * 2);
  score += Math.min(10, input.events.length);
  score += Math.round(healthTrend.score * 0.15);

  if (input.growthHeights.length >= 2) score += 10;
  if (input.lastGrowthPhotoAt && daysBetween(input.lastGrowthPhotoAt) < 30) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function lastEvolvedAt(events: GenomeComputeInput["events"]): string | null {
  if (events.length === 0) return null;
  return events.reduce((latest, e) =>
    e.recordedAt > latest ? e.recordedAt : latest
  , events[0].recordedAt);
}

/** Core mock genome engine — deterministic from plant telemetry + species baseline. */
export function computePlantGenome(
  input: GenomeComputeInput,
  now = new Date()
): PlantGenomeState {
  const baseline = resolveSpeciesBaseline(input.plantName, input.species);
  const ageDays = daysBetween(input.plantCreatedAt, now);
  const month = now.getMonth() + 1;

  const growthTrend = computeGrowthTrend(
    input.growthHeights,
    input.growthEntryCount,
    ageDays,
    baseline
  );
  const healthTrend = computeHealthTrend(
    input.healthStatus,
    input.healthScanCount,
    input.lastHealthScanAt,
    input.tasksCompleted,
    input.lastWateredAt
  );

  const bloomStage = inferBloomStage(month, baseline, input.healthStatus);
  const fruitStage = inferFruitStage(month, baseline, input.plantName, input.species);
  const dormancyStatus = inferDormancy(month, baseline, input.locationType);

  const riskScore = computeRiskScore(input, baseline);
  const recoveryScore = computeRecoveryScore(input, healthTrend, riskScore);
  const intelligenceScore = computeIntelligenceScore(input, healthTrend);

  const forecasts = buildForecasts(input, baseline, riskScore, now);

  return {
    plantId: input.plantId,
    computedAt: now.toISOString(),
    version: GENOME_VERSION,
    ageDays,
    ageLabel: formatAgeLabel(ageDays),
    lifeStage: inferLifeStage(ageDays, baseline),
    growthTrend,
    healthTrend,
    bloomStage,
    fruitStage,
    dormancyStatus,
    riskScore,
    recoveryScore,
    intelligenceScore,
    ...forecasts,
    telemetrySummary: {
      photoCount: input.photoCount,
      growthMeasurements: input.growthEntryCount,
      tasksCompleted: input.tasksCompleted,
      healthScans: input.healthScanCount,
      lastEvolvedAt: lastEvolvedAt(input.events),
    },
    speciesBaseline: baseline,
    source: "computed",
  };
}
