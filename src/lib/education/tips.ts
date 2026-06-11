import type { DailyTip } from "./types";

export const DAILY_TIPS: DailyTip[] = [
  {
    id: "tip-1",
    text: "Deep watering builds stronger roots.",
    whyItMatters:
      "Shallow watering keeps roots near the surface and makes plants weaker during heat.",
    actionToday:
      "Water outdoor trees slowly for 20 to 30 minutes instead of quick spraying.",
    lessonId: "water-deeply",
  },
  {
    id: "tip-2",
    text: "Yellow leaves on older growth can be normal. Yellow leaves on new growth are a bigger warning sign.",
    lessonId: "yellow-leaves",
  },
  {
    id: "tip-3",
    text: "Most potted plants die from poor drainage, not lack of love.",
    lessonId: "soil-drainage",
  },
  {
    id: "tip-4",
    text: "Before fertilizing, make sure the plant is actively growing.",
    lessonId: "new-growth",
  },
  {
    id: "tip-5",
    text: "Check soil moisture before watering. Your finger is the best tool you have.",
    lessonId: "overwatering-signs",
  },
  {
    id: "tip-6",
    text: "Morning sun is gentler than afternoon sun. Many plants prefer the difference.",
    lessonId: "sun-exposure",
  },
  {
    id: "tip-7",
    text: "Never remove more than one-third of a plant when pruning. Less is often more.",
    lessonId: "prune-safely",
  },
  {
    id: "tip-8",
    text: "Citrus trees are hungry in spring but rest in winter. Match feeding to growth.",
    lessonId: "fertilize-citrus",
  },
  {
    id: "tip-9",
    text: "New growth tells the truth about plant health better than old leaves do.",
    lessonId: "new-growth",
  },
  {
    id: "tip-10",
    text: "Water at the drip line for trees. That's where the roots actually drink.",
    lessonId: "maple-watering",
  },
  {
    id: "tip-11",
    text: "Grouping indoor plants together creates a mini humid microclimate.",
    lessonId: "indoor-humidity",
  },
  {
    id: "tip-12",
    text: "Out-of-season leaf drop with spots is not normal. Investigate before waiting.",
    lessonId: "seasonal-leaf-drop",
  },
  {
    id: "tip-13",
    text: "Iron deficiency on citrus shows as yellow new leaves with green veins.",
    lessonId: "citrus-yellow-leaves",
  },
  {
    id: "tip-14",
    text: "Afternoon wilting that recovers by morning is heat stress, not always drought.",
    lessonId: "maple-watering",
  },
];

export function getDailyTip(): DailyTip {
  const dayIndex = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000
  );
  return DAILY_TIPS[dayIndex % DAILY_TIPS.length];
}
