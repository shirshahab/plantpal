import { AccountTier as Tier } from "@/lib/billing/tier-config";
import {
  formatMonthlyEquivalent,
  formatPrice,
  OFFICIAL_PRICING,
  PLAN_BADGES,
  PLAN_INCLUDES,
} from "@/lib/billing/pricing";
import type { BillingCycle } from "@/lib/types/billing";
import type { SubscriptionPlan } from "./types";

export function buildSubscriptionPlans(cycle: BillingCycle = "monthly"): SubscriptionPlan[] {
  const pro = OFFICIAL_PRICING.pro;
  const family = OFFICIAL_PRICING.family;

  return [
    {
      id: Tier.FREE,
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Start tracking plants with sensible limits.",
      featured: false,
      features: PLAN_INCLUDES[Tier.FREE],
      restrictions: ["20 scans per month", "25 plants max", "Academy basics only"],
    },
    {
      id: Tier.PLUS,
      name: "PlantPal Pro",
      price: cycle === "monthly" ? formatPrice(pro.monthly) : formatPrice(pro.annual),
      period: cycle === "monthly" ? "/month" : "/year",
      annualPrice: formatMonthlyEquivalent(pro.annual),
      annualPeriod: "/mo billed annually",
      description: "Unlimited scans, plants, and pro-grade garden tools.",
      featured: true,
      badge: PLAN_BADGES[Tier.PLUS],
      features: PLAN_INCLUDES[Tier.PLUS],
    },
    {
      id: Tier.FAMILY,
      name: "PlantPal Pro Family",
      price: cycle === "monthly" ? formatPrice(family.monthly) : formatPrice(family.annual),
      period: cycle === "monthly" ? "/month" : "/year",
      annualPrice: formatMonthlyEquivalent(family.annual),
      annualPeriod: "/mo billed annually",
      description: "Pro for the whole household, with shared gardens.",
      featured: false,
      features: PLAN_INCLUDES[Tier.FAMILY],
    },
  ];
}

export const SUBSCRIPTION_PLANS = buildSubscriptionPlans("monthly");

/** Paid plans for paywall (Pro + Family, monthly + annual variants). */
export interface PaywallPlanOption {
  tier: typeof Tier.PLUS | typeof Tier.FAMILY;
  cycle: BillingCycle;
  name: string;
  price: string;
  period: string;
  subline?: string;
  featured?: boolean;
}

export function buildPaywallPlans(): PaywallPlanOption[] {
  const pro = OFFICIAL_PRICING.pro;
  const family = OFFICIAL_PRICING.family;
  return [
    {
      tier: Tier.PLUS,
      cycle: "monthly",
      name: "Pro Monthly",
      price: formatPrice(pro.monthly),
      period: "/month",
      featured: true,
    },
    {
      tier: Tier.PLUS,
      cycle: "annual",
      name: "Pro Yearly",
      price: formatPrice(pro.annual),
      period: "/year",
      subline: `${formatMonthlyEquivalent(pro.annual)}/mo · Save ${pro.annualSavingsPercent}%`,
    },
    {
      tier: Tier.FAMILY,
      cycle: "monthly",
      name: "Family Monthly",
      price: formatPrice(family.monthly),
      period: "/month",
    },
    {
      tier: Tier.FAMILY,
      cycle: "annual",
      name: "Family Yearly",
      price: formatPrice(family.annual),
      period: "/year",
      subline: `${formatMonthlyEquivalent(family.annual)}/mo · Save ${family.annualSavingsPercent}%`,
    },
  ];
}
