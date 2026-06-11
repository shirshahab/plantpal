export type SeasonalHorizon = "today" | "week" | "month";

export interface SeasonalTask {
  id: string;
  title: string;
  description: string;
  horizon: SeasonalHorizon;
  category: "feed" | "water" | "prune" | "pest" | "plant" | "harvest" | "mulch";
  priority: "high" | "medium" | "low";
  plantTypes?: string[];
  emoji: string;
}

function monthName(d = new Date()): string {
  return d.toLocaleString("en-US", { month: "long" });
}

function seasonForMonth(month: number): "spring" | "summer" | "fall" | "winter" {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

/** Location-aware seasonal tasks — Pasadena / SoCal June example + generic fallbacks. */
export function generateSeasonalTasks(input: {
  city?: string;
  zipCode?: string;
  month?: number;
  plantLabels?: string[];
}): SeasonalTask[] {
  const month = input.month ?? new Date().getMonth();
  const season = seasonForMonth(month);
  const city = (input.city ?? input.zipCode ?? "your area").toLowerCase();
  const isSoCal = city.includes("pasadena") || city.includes("911") || city.includes("los angeles");

  const tasks: SeasonalTask[] = [];

  if (isSoCal && month === 5) {
    tasks.push(
      {
        id: "s-citrus-feed",
        title: "Feed citrus trees",
        description: "Apply citrus-specific fertilizer before summer heat.",
        horizon: "today",
        category: "feed",
        priority: "high",
        plantTypes: ["citrus"],
        emoji: "🍋",
      },
      {
        id: "s-deadhead-roses",
        title: "Deadhead roses",
        description: "Remove spent blooms to encourage a second flush.",
        horizon: "today",
        category: "prune",
        priority: "medium",
        plantTypes: ["rose"],
        emoji: "🌹",
      },
      {
        id: "s-aphid-watch",
        title: "Watch for aphids",
        description: "Check new growth on roses and citrus. Blast with water early.",
        horizon: "week",
        category: "pest",
        priority: "high",
        emoji: "🐛",
      },
      {
        id: "s-mulch-veg",
        title: "Mulch vegetables",
        description: "2–3\" mulch keeps soil cool and retains moisture.",
        horizon: "week",
        category: "mulch",
        priority: "medium",
        plantTypes: ["vegetable"],
        emoji: "🥬",
      }
    );
  } else if (season === "spring") {
    tasks.push(
      {
        id: "s-spring-feed",
        title: "Spring feeding",
        description: "Balanced fertilizer as plants wake up.",
        horizon: "today",
        category: "feed",
        priority: "high",
        emoji: "🌱",
      },
      {
        id: "s-spring-plant",
        title: "Plant summer color",
        description: "Set out warm-season annuals after last frost.",
        horizon: "month",
        category: "plant",
        priority: "medium",
        emoji: "🌸",
      }
    );
  } else if (season === "summer") {
    tasks.push(
      {
        id: "s-summer-water",
        title: "Deep water trees",
        description: "Slow soak 1–2× weekly during heat waves.",
        horizon: "today",
        category: "water",
        priority: "high",
        emoji: "💧",
      },
      {
        id: "s-summer-mulch",
        title: "Refresh mulch",
        description: "Top-dress beds to reduce evaporation.",
        horizon: "week",
        category: "mulch",
        priority: "medium",
        emoji: "🪵",
      }
    );
  } else if (season === "fall") {
    tasks.push(
      {
        id: "s-fall-plant",
        title: "Plant bulbs & natives",
        description: "Best window for California natives and spring bulbs.",
        horizon: "month",
        category: "plant",
        priority: "medium",
        emoji: "🌷",
      }
    );
  } else {
    tasks.push(
      {
        id: "s-winter-protect",
        title: "Protect frost-sensitive plants",
        description: "Cover or move pots before cold snaps.",
        horizon: "today",
        category: "plant",
        priority: "high",
        emoji: "❄️",
      }
    );
  }

  const hasCitrus = input.plantLabels?.some((l) => /citrus|lemon|orange|lime/i.test(l));
  if (hasCitrus && !tasks.some((t) => t.plantTypes?.includes("citrus"))) {
    tasks.push({
      id: "s-citrus-dynamic",
      title: "Check citrus moisture",
      description: "Your citrus trees need consistent deep watering this season.",
      horizon: "week",
      category: "water",
      priority: "high",
      plantTypes: ["citrus"],
      emoji: "🍊",
    });
  }

  tasks.push({
    id: "s-month-review",
    title: `${monthName()} garden review`,
    description: "Walk your garden map and update plant health scores.",
    horizon: "month",
    category: "plant",
    priority: "low",
    emoji: "📋",
  });

  return tasks;
}

export function groupTasksByHorizon(tasks: SeasonalTask[]): Record<SeasonalHorizon, SeasonalTask[]> {
  return {
    today: tasks.filter((t) => t.horizon === "today"),
    week: tasks.filter((t) => t.horizon === "week"),
    month: tasks.filter((t) => t.horizon === "month"),
  };
}

export const SEASONAL_ILLUSTRATIONS: Record<string, string> = {
  spring: "🌸",
  summer: "☀️",
  fall: "🍂",
  winter: "❄️",
};
