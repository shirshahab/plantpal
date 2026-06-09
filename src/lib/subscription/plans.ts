import type { BillingCycle } from "@/lib/types/billing";
import { AccountTier as Tier } from "@/lib/billing/tier-config";
import {
  formatMonthlyEquivalent,
  formatPrice,
  OFFICIAL_PRICING,
  PLAN_BADGES,
  PLAN_INCLUDES,
} from "@/lib/billing/pricing";
import type { SubscriptionPlan } from "./types";

export function buildSubscriptionPlans(cycle: BillingCycle = "monthly"): SubscriptionPlan[] {
  const plus = OFFICIAL_PRICING.plus;
  const family = OFFICIAL_PRICING.family;

  return [
    {
      id: Tier.FREE,
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Start tracking your first plants.",
      featured: false,
      features: PLAN_INCLUDES[Tier.FREE],
      restrictions: [
        "No AI Doctor",
        "No AI Care Plans",
        "No Climate Intelligence",
        "No Price Checker",
        "No Plant Genome",
        "No Concierge",
        "No Landscape Designer",
      ],
    },
    {
      id: Tier.PLUS,
      name: "PlantPal Plus",
      price: cycle === "monthly" ? formatPrice(plus.monthly) : formatPrice(plus.annual),
      period: cycle === "monthly" ? "/month" : "/year",
      annualPrice: formatMonthlyEquivalent(plus.annual),
      annualPeriod: "/mo billed annually",
      description: "For serious plant parents and gardeners.",
      featured: true,
      badge: PLAN_BADGES[Tier.PLUS],
      features: PLAN_INCLUDES[Tier.PLUS],
    },
    {
      id: Tier.FAMILY,
      name: "Family",
      price: cycle === "monthly" ? formatPrice(family.monthly) : formatPrice(family.annual),
      period: cycle === "monthly" ? "/month" : "/year",
      annualPrice: formatMonthlyEquivalent(family.annual),
      annualPeriod: "/mo billed annually",
      description: "For households and full properties.",
      featured: false,
      badge: PLAN_BADGES[Tier.FAMILY],
      features: PLAN_INCLUDES[Tier.FAMILY],
    },
  ];
}

export const SUBSCRIPTION_PLANS = buildSubscriptionPlans("monthly");
