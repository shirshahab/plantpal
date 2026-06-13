/** Re-exports — pulse logic lives in src/lib/local/grower-pulse.ts */
export {
  buildGrowerPulse,
  getLocalGrowerInsights,
  getLocalAreaName,
  type GrowerPulseLine,
  type GrowerPulseResult,
} from "@/lib/local/grower-pulse";

export type LocalGrowerInsight = { emoji: string; text: string };
