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
    maxPlants: 25,
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
  | BillingFeature
  | "plant_limit"
  | "scan_limit"
  | "ai_care_plans"
  | "growth_forecasts"
  | "shared_gardens"
  | "household_access",
  { title: string; message: string; lockLabel: "Pro Feature" | "Family Feature" }
> = {
  plant_limit: {
    title: "You have reached the free limit of 25 plants.",
    message: "Unlock unlimited plants with PlantPal Pro.",
    lockLabel: "Pro Feature",
  },
  scan_limit: {
    title: "Monthly scan limit reached.",
    message: "Free includes 20 scans per month. Upgrade to PlantPal Pro for unlimited scans.",
    lockLabel: "Pro Feature",
  },
  unlimited_scans: {
    title: "Unlimited scans",
    message: "You've used all 20 free scans this month. Upgrade to PlantPal Pro for unlimited scans.",
    lockLabel: "Pro Feature",
  },
  unlimited_plants: {
    title: "Unlock unlimited plants.",
    message: "Track every tree, pot, and bed with PlantPal Pro.",
    lockLabel: "Pro Feature",
  },
  ai_doctor: {
    title: "AI Plant Doctor",
    message: "Get diagnosis-style action plans with PlantPal Plus.",
    lockLabel: "Pro Feature",
  },
  ai_care_plan: {
    title: "AI Care Plans",
    message: "Generate personalized watering, feeding, and pruning schedules.",
    lockLabel: "Pro Feature",
  },
  ai_care_plans: {
    title: "AI Care Plans",
    message: "Generate personalized watering, feeding, and pruning schedules.",
    lockLabel: "Pro Feature",
  },
  climate_intelligence: {
    title: "Climate Intelligence",
    message: "Local weather, frost alerts, and ZIP-matched care tips.",
    lockLabel: "Pro Feature",
  },
  price_checker: {
    title: "Price Checker",
    message: "Know fair nursery prices before you buy.",
    lockLabel: "Pro Feature",
  },
  plant_genome: {
    title: "Plant Genome",
    message: "Track growth stages, consistency scores, and forecasts.",
    lockLabel: "Pro Feature",
  },
  growth_forecasts: {
    title: "Plant Genome",
    message: "See 30- and 90-day outlooks for your plant genome.",
    lockLabel: "Pro Feature",
  },
  growth_timeline: {
    title: "Growth Timeline",
    message: "Visualize milestones and seasonal progress.",
    lockLabel: "Pro Feature",
  },
  plant_scanner: {
    title: "Plant Scanner",
    message: "Identify plants and nursery tags with AI.",
    lockLabel: "Pro Feature",
  },
  advanced_learning: {
    title: "Advanced Learning Hub",
    message: "Deep-dive lessons and guided plant journeys.",
    lockLabel: "Pro Feature",
  },
  priority_ai: {
    title: "Priority AI Processing",
    message: "Faster AI responses during peak times.",
    lockLabel: "Pro Feature",
  },
  landscape_designer: {
    title: "AI Landscape Designer",
    message: "Upload yard photos and get climate-matched planting plans with PlantPal Pro.",
    lockLabel: "Pro Feature",
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
  full_academy: {
    title: "Full Academy",
    message: "Unlock every learning path with PlantPal Pro.",
    lockLabel: "Pro Feature",
  },
  advanced_diagnosis: {
    title: "Advanced diagnosis",
    message: "Get deeper AI health analysis with PlantPal Pro.",
    lockLabel: "Pro Feature",
  },
  landscape_ai: {
    title: "Landscape AI",
    message: "Generate yard designs with PlantPal Pro.",
    lockLabel: "Pro Feature",
  },
  seasonal_courses: {
    title: "Seasonal courses",
    message: "Location-aware seasonal care is included with PlantPal Pro.",
    lockLabel: "Pro Feature",
  },
  export_reports: {
    title: "Export reports",
    message: "Download care history and health reports with PlantPal Pro.",
    lockLabel: "Pro Feature",
  },
  academy_basics: {
    title: "Academy basics",
    message: "Beginner Gardening is free. Upgrade for all paths.",
    lockLabel: "Pro Feature",
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
