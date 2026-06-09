import type { AccountTier } from "@/lib/billing/tier-config";
import { AccountTier as Tier } from "@/lib/billing/tier-config";
import { featuresForTier } from "@/lib/billing/feature-gates";
import type { BillingFeature } from "@/lib/billing/feature-gates";
import { getFeatureLockLabel } from "@/lib/billing/feature-gates";

export type { AccountTier };
export { AccountTier as TierConst } from "@/lib/billing/tier-config";

/** @deprecated Prefer BillingFeature — kept for existing imports */
export type SubscriptionFeature =
  | BillingFeature
  | "ai_care_plans"
  | "growth_forecasts"
  | "shared_gardens"
  | "household_access";

export interface TierLimits {
  maxPlants: number | null;
  features: BillingFeature[];
}

export interface SubscriptionPlan {
  id: AccountTier;
  name: string;
  price: string;
  period: string;
  annualPrice?: string;
  annualPeriod?: string;
  description: string;
  featured: boolean;
  badge?: string;
  features: string[];
  restrictions?: string[];
}

export const TIER_LIMITS: Record<AccountTier, TierLimits> = {
  free: {
    maxPlants: 3,
    features: [],
  },
  plus: {
    maxPlants: null,
    features: featuresForTier(Tier.PLUS),
  },
  family: {
    maxPlants: null,
    features: featuresForTier(Tier.FAMILY),
  },
};

export const UPGRADE_COPY: Record<
  BillingFeature | "plant_limit" | "ai_care_plans" | "growth_forecasts" | "shared_gardens" | "household_access",
  { title: string; message: string; lockLabel: "Plus Feature" | "Family Feature" }
> = {
  plant_limit: {
    title: "You have reached the free limit of 3 plants.",
    message: "Unlock unlimited plants with PlantPal Plus.",
    lockLabel: "Plus Feature",
  },
  unlimited_plants: {
    title: "Unlock unlimited plants.",
    message: "Track every tree, pot, and bed with PlantPal Plus.",
    lockLabel: "Plus Feature",
  },
  ai_doctor: {
    title: "AI Plant Doctor",
    message: "Get diagnosis-style action plans with PlantPal Plus.",
    lockLabel: "Plus Feature",
  },
  ai_care_plan: {
    title: "AI Care Plans",
    message: "Generate personalized watering, feeding, and pruning schedules.",
    lockLabel: "Plus Feature",
  },
  ai_care_plans: {
    title: "AI Care Plans",
    message: "Generate personalized watering, feeding, and pruning schedules.",
    lockLabel: "Plus Feature",
  },
  climate_intelligence: {
    title: "Climate Intelligence",
    message: "Local weather, frost alerts, and ZIP-matched care tips.",
    lockLabel: "Plus Feature",
  },
  price_checker: {
    title: "Price Checker",
    message: "Know fair nursery prices before you buy.",
    lockLabel: "Plus Feature",
  },
  plant_genome: {
    title: "Plant Genome",
    message: "Track growth stages, consistency scores, and forecasts.",
    lockLabel: "Plus Feature",
  },
  growth_forecasts: {
    title: "Plant Genome",
    message: "See 30- and 90-day outlooks for your plant genome.",
    lockLabel: "Plus Feature",
  },
  growth_timeline: {
    title: "Growth Timeline",
    message: "Visualize milestones and seasonal progress.",
    lockLabel: "Plus Feature",
  },
  plant_scanner: {
    title: "Plant Scanner",
    message: "Identify plants and nursery tags with AI.",
    lockLabel: "Plus Feature",
  },
  advanced_learning: {
    title: "Advanced Learning Hub",
    message: "Deep-dive lessons and guided plant journeys.",
    lockLabel: "Plus Feature",
  },
  priority_ai: {
    title: "Priority AI Processing",
    message: "Faster AI responses during peak times.",
    lockLabel: "Plus Feature",
  },
  landscape_designer: {
    title: "AI Landscape Designer",
    message: "Upload yard photos and get climate-matched planting plans.",
    lockLabel: "Family Feature",
  },
  concierge: {
    title: "PlantPal Concierge",
    message: "Personalized recovery plans when your plant struggles.",
    lockLabel: "Family Feature",
  },
  multiple_properties: {
    title: "Multiple properties",
    message: "Manage yards, rentals, and vacation homes in one account.",
    lockLabel: "Family Feature",
  },
  family_sharing: {
    title: "Family sharing",
    message: "Let everyone in your household see the same garden.",
    lockLabel: "Family Feature",
  },
  shared_gardens: {
    title: "Shared gardens",
    message: "Let everyone in your household see the same garden.",
    lockLabel: "Family Feature",
  },
  household_access: {
    title: "Household access",
    message: "Invite family members to share care tasks and reminders.",
    lockLabel: "Family Feature",
  },
  advanced_reminders: {
    title: "Advanced reminders",
    message: "Smarter schedules and priority alerts for your garden.",
    lockLabel: "Family Feature",
  },
};

export function getUpgradeCopy(feature: string) {
  const copy = UPGRADE_COPY[feature as keyof typeof UPGRADE_COPY];
  if (copy) return copy;
  return {
    title: "Upgrade to unlock",
    message: "This feature requires a paid plan.",
    lockLabel: getFeatureLockLabel(feature),
  };
}

export { TIER_LABELS } from "@/lib/billing/tier-config";
