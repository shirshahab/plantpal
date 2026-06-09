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
  const pro = OFFICIAL_PRICING.pro;

  return [
    {
      id: Tier.FREE,
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Start tracking plants with sensible limits.",
      featured: false,
      features: PLAN_INCLUDES[Tier.FREE],
      restrictions: [
        "20 scans per month",
        "25 plants max",
        "Academy basics only",
      ],
    },
    {
      id: Tier.PLUS,
      name: "PlantPal Pro",
      price: cycle === "monthly" ? formatPrice(pro.monthly) : formatPrice(pro.annual),
      period: cycle === "monthly" ? "/month" : "/year",
      annualPrice: formatMonthlyEquivalent(pro.annual),
      annualPeriod: "/mo billed annually",
      description: "Unlimited scans, plants, and pro-grade AI tools.",
      featured: true,
      badge: PLAN_BADGES[Tier.PLUS],
      features: PLAN_INCLUDES[Tier.PLUS],
    },
  ];
}

export const SUBSCRIPTION_PLANS = buildSubscriptionPlans("monthly");
