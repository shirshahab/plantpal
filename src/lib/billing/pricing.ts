import type { PlanPricing } from "@/lib/types/billing";
import { AccountTier } from "./tier-config";

export { AccountTier, TIER_LABELS } from "./tier-config";

export const OFFICIAL_PRICING: Record<"plus" | "family", PlanPricing> = {
  plus: {
    monthly: 7.99,
    annual: 59,
    annualSavingsPercent: 38,
  },
  family: {
    monthly: 14.99,
    annual: 119,
    annualSavingsPercent: 34,
  },
};

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

export function formatMonthlyEquivalent(annualTotal: number): string {
  return formatPrice(annualTotal / 12);
}

export const PLAN_INCLUDES: Record<AccountTier, string[]> = {
  [AccountTier.FREE]: [
    "Up to 3 plants",
    "Basic plant tracking",
    "Basic reminders",
    "Basic lessons",
    "Manual notes",
    "Limited photo history",
  ],
  [AccountTier.PLUS]: [
    "Unlimited plants",
    "AI Plant Doctor",
    "AI Care Plans",
    "Plant Scanner",
    "Local Climate Intelligence",
    "Growth Timeline",
    "Price Checker",
    "Plant Genome",
    "Advanced Learning Hub",
    "Priority AI Processing",
  ],
  [AccountTier.FAMILY]: [
    "Everything in Plus",
    "Multiple properties",
    "Shared household gardens",
    "Multiple users",
    "Landscape Designer",
    "Concierge Plans",
    "Advanced reminders",
    "Future family sharing features",
  ],
};

export const PLAN_BADGES: Partial<Record<AccountTier, string>> = {
  [AccountTier.PLUS]: "Most Popular",
  [AccountTier.FAMILY]: "Best Value",
};
