import type {
  ForecastItem,
  GenomeComputeInput,
  SpeciesGenomeBaseline,
} from "./types";

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function monthIn(month: number, list: number[]): boolean {
  return list.includes(month);
}

function windowItem(
  id: string,
  category: ForecastItem["category"],
  title: string,
  description: string,
  start: Date,
  end: Date,
  confidence: ForecastItem["confidence"],
  source: ForecastItem["source"] = "mock"
): ForecastItem {
  return {
    id,
    category,
    title,
    description,
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
    confidence,
    source,
  };
}

function nextMonthWindow(
  now: Date,
  months: number[],
  offsetDays: number,
  spanDays: number
): { start: Date; end: Date } | null {
  if (months.length === 0) return null;
  const currentMonth = now.getMonth() + 1;
  let targetMonth = months.find((m) => m >= currentMonth) ?? months[0];
  let year = now.getFullYear();
  if (targetMonth < currentMonth) year += 1;

  const start = new Date(year, targetMonth - 1, 1);
  start.setDate(start.getDate() + offsetDays);
  const end = addDays(start, spanDays);
  return { start, end };
}

export function buildForecasts(
  input: GenomeComputeInput,
  baseline: SpeciesGenomeBaseline,
  riskScore: number,
  now = new Date()
): {
  forecast30: ForecastItem[];
  forecast90: ForecastItem[];
  forecastSeason: ForecastItem[];
  upcomingMilestones: ForecastItem[];
} {
  const forecast30: ForecastItem[] = [];
  const forecast90: ForecastItem[] = [];
  const forecastSeason: ForecastItem[] = [];
  const upcomingMilestones: ForecastItem[] = [];

  const month = now.getMonth() + 1;

  // ── 30-day window ────────────────────────────────────────────────────────
  if (baseline.isFlowering && monthIn(month, baseline.bloomMonths)) {
    forecast30.push(
      windowItem(
        "f30-bloom",
        "flowering",
        "Active bloom period",
        `${baseline.commonName} typically flowers around now. Watch for buds opening and avoid heavy pruning.`,
        now,
        addDays(now, 21),
        baseline.bloomMonths.includes(month) ? "high" : "medium"
      )
    );
  }

  if (baseline.isFruitBearing && monthIn(month, baseline.fruitMonths)) {
    forecast30.push(
      windowItem(
        "f30-fruit",
        "fruiting",
        "Fruit development window",
        "Monitor fruit size and color. Deep water before heat spikes to prevent drop.",
        now,
        addDays(now, 28),
        "medium"
      )
    );
  }

  if (input.tempHighF && input.tempHighF >= 90) {
    forecast30.push(
      windowItem(
        "f30-heat",
        "heat_stress",
        "Heat stress risk — elevated",
        `Highs near ${Math.round(input.tempHighF)}°F. Shade young growth and check soil moisture daily.`,
        now,
        addDays(now, 7),
        "high"
      )
    );
  } else if (riskScore >= 55) {
    forecast30.push(
      windowItem(
        "f30-heat-watch",
        "heat_stress",
        "Heat stress watch",
        "Risk score is elevated — increase watering checks during warm afternoons.",
        now,
        addDays(now, 14),
        "medium"
      )
    );
  }

  if (input.healthStatus !== "healthy") {
    forecast30.push(
      windowItem(
        "f30-recovery",
        "milestone",
        "Recovery checkpoint",
        "Re-scan or photograph in 2 weeks to confirm health trend is improving.",
        addDays(now, 10),
        addDays(now, 21),
        "medium"
      )
    );
  }

  // ── 90-day window ────────────────────────────────────────────────────────
  const repot = nextMonthWindow(now, baseline.repottingMonths, 5, 21);
  if (repot && input.locationType === "indoor") {
    forecast90.push(
      windowItem(
        "f90-repot",
        "repotting",
        "Repotting window",
        "Root-bound signs? Spring repotting window is approaching for container plants.",
        repot.start,
        repot.end,
        "medium",
        "species"
      )
    );
  }

  const prune = nextMonthWindow(now, baseline.pruningMonths, 0, 28);
  if (prune) {
    forecast90.push(
      windowItem(
        "f90-prune",
        "pruning",
        "Pruning window",
        `Light structural pruning for ${baseline.commonName} — avoid removing more than 20% at once.`,
        prune.start,
        prune.end,
        "medium",
        "species"
      )
    );
  }

  const nextBloom = nextMonthWindow(now, baseline.bloomMonths, 0, 14);
  if (nextBloom && baseline.isFlowering) {
    forecast90.push(
      windowItem(
        "f90-bloom",
        "flowering",
        "Expected flowering",
        `Based on species pattern, next bloom window for ${baseline.commonName}.`,
        nextBloom.start,
        nextBloom.end,
        "medium",
        "species"
      )
    );
  }

  const nextFruit = nextMonthWindow(now, baseline.fruitMonths, 0, 30);
  if (nextFruit && baseline.isFruitBearing) {
    forecast90.push(
      windowItem(
        "f90-fruit",
        "fruiting",
        "Expected fruiting",
        "Fruit set and ripening window based on species calendar.",
        nextFruit.start,
        nextFruit.end,
        "medium",
        "species"
      )
    );
  }

  // ── Season (next ~120 days) ──────────────────────────────────────────────
  if (monthIn(month, baseline.dormantMonths) || monthIn((month % 12) + 1, baseline.dormantMonths)) {
    forecastSeason.push(
      windowItem(
        "fs-dormancy",
        "dormancy",
        "Dormancy period",
        "Reduce fertilizer and adjust watering as growth slows for the season.",
        now,
        addDays(now, 90),
        "high",
        "species"
      )
    );
  } else {
    forecastSeason.push(
      windowItem(
        "fs-active",
        "fertilizing",
        "Active growth season",
        "Primary growing season — maintain feeding schedule and monitor new flush.",
        now,
        addDays(now, 120),
        "medium",
        "species"
      )
    );
  }

  if (baseline.heatTolerance === "low") {
    forecastSeason.push(
      windowItem(
        "fs-heat-season",
        "heat_stress",
        "Summer heat stress risk",
        "This species has low heat tolerance — plan afternoon shade or misting during heat waves.",
        addDays(now, 30),
        addDays(now, 120),
        "medium",
        "species"
      )
    );
  }

  // Milestones from growth trajectory
  if (input.growthHeights.length >= 1) {
    const latest = input.growthHeights[0];
    const pct = Math.min(100, Math.round((latest / baseline.maxHeightInches) * 100));
    if (pct < 90) {
      upcomingMilestones.push(
        windowItem(
          "ms-height",
          "milestone",
          `${pct}% of mature height`,
          `Currently tracking toward ${baseline.maxHeightInches}" mature size.`,
          addDays(now, 30),
          addDays(now, 180),
          "low"
        )
      );
    }
  }

  if (input.growthEntryCount >= 3) {
    upcomingMilestones.push(
      windowItem(
        "ms-timeline",
        "milestone",
        "Growth timeline established",
        "Enough data points for trend forecasting — keep monthly progress photos.",
        now,
        addDays(now, 30),
        "high"
      )
    );
  }

  if (input.tasksCompleted >= 5) {
    upcomingMilestones.push(
      windowItem(
        "ms-care-streak",
        "milestone",
        "Care consistency milestone",
        `${input.tasksCompleted} tasks logged — genome intelligence improving.`,
        now,
        addDays(now, 14),
        "high"
      )
    );
  }

  if (input.primaryGoalName) {
    upcomingMilestones.unshift(
      windowItem(
        "ms-goal",
        "milestone",
        `Goal: ${input.primaryGoalName}`,
        "Your selected plant goal shapes care missions and genome forecasts.",
        now,
        addDays(now, 30),
        "high"
      )
    );
  }

  return { forecast30, forecast90, forecastSeason, upcomingMilestones };
}
