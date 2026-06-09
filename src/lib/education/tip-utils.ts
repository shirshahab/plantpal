import type { DailyTip } from "./types";

const DEFAULT_WHY = "Small daily habits compound into healthier, more resilient plants.";
const DEFAULT_ACTION = "Spend 5 minutes checking one plant's soil moisture and leaves.";

export function enrichTip(tip: DailyTip): Required<Pick<DailyTip, "whyItMatters" | "actionToday">> & DailyTip {
  return {
    ...tip,
    whyItMatters: tip.whyItMatters ?? DEFAULT_WHY,
    actionToday: tip.actionToday ?? DEFAULT_ACTION,
  };
}
