"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildSubscriptionPlans } from "@/lib/subscription/plans";
import type { AccountTier } from "@/lib/billing/tier-config";
import type { BillingCycle } from "@/lib/types/billing";
import { OFFICIAL_PRICING } from "@/lib/billing/pricing";

interface PlanCardsProps {
  currentTier?: AccountTier;
  onSelectPlan?: (tier: AccountTier, cycle: BillingCycle) => void;
  ctaMode?: "waitlist" | "upgrade";
  showNote?: boolean;
  billingCycle?: BillingCycle;
  onBillingCycleChange?: (cycle: BillingCycle) => void;
  hideUpgradePrompts?: boolean;
  plansFilter?: AccountTier[];
}

export function PlanCards({
  currentTier,
  onSelectPlan,
  ctaMode = "waitlist",
  showNote = true,
  billingCycle = "monthly",
  onBillingCycleChange,
  hideUpgradePrompts = false,
  plansFilter,
}: PlanCardsProps) {
  const allPlans = buildSubscriptionPlans(billingCycle);
  const plans = plansFilter
    ? allPlans.filter((p) => plansFilter.includes(p.id))
    : allPlans;
  const hideCta = hideUpgradePrompts;

  return (
    <>
      {onBillingCycleChange && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => onBillingCycleChange("monthly")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors touch-manipulation",
                billingCycle === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => onBillingCycleChange("annual")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors touch-manipulation",
                billingCycle === "annual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Annual
              <span className="ml-1.5 text-xs text-green-600 font-semibold">
                Save {OFFICIAL_PRICING.pro.annualSavingsPercent}%
              </span>
            </button>
          </div>
        </div>
      )}

      <div className={cn("grid gap-6 lg:gap-8 items-stretch", plans.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" : "grid-cols-1 md:grid-cols-3")}>
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-2xl border p-6 sm:p-8 flex flex-col",
                plan.featured
                  ? "border-brand-primary bg-white shadow-lg shadow-brand-primary/10 ring-1 ring-brand-primary/20"
                  : "border-brand-sage/25 bg-white shadow-sm",
                isCurrent && "ring-2 ring-green-500/40"
              )}
            >
              {plan.badge && !isCurrent && (
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full w-fit mb-4",
                    plan.id === "plus"
                      ? "text-brand-primary bg-brand-sage/20"
                      : "text-violet-700 bg-violet-100"
                  )}
                >
                  {plan.badge}
                </span>
              )}
              {isCurrent && (
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full w-fit mb-4">
                  Current plan
                </span>
              )}
              <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
              <div className="mt-3 flex items-baseline gap-1 flex-wrap">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-500">{plan.period}</span>
              </div>
              {billingCycle === "annual" && plan.annualPrice && plan.id !== "free" && (
                <p className="text-xs text-gray-500 mt-1">
                  {plan.annualPrice}
                  {plan.annualPeriod}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">{plan.description}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-brand-growth shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {ctaMode === "upgrade" && onSelectPlan && !hideCta ? (
                <Button
                  variant={plan.featured ? "primary" : "outline"}
                  size="lg"
                  className="w-full mt-8 touch-manipulation"
                  disabled={isCurrent}
                  onClick={() => onSelectPlan(plan.id, billingCycle)}
                >
                  {isCurrent ? (
                    "Current plan"
                  ) : plan.id === "free" ? (
                    "Downgrade to Free"
                  ) : plan.id === "plus" ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Upgrade to Pro
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Upgrade to Family
                    </>
                  )}
                </Button>
              ) : ctaMode === "waitlist" ? (
                <Link href="/waitlist" className="mt-8 block">
                  <Button
                    variant={plan.featured ? "primary" : "outline"}
                    size="lg"
                    className="w-full"
                  >
                    Join Waitlist
                  </Button>
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
      {showNote && (
        <p className="text-center text-sm text-gray-400 mt-10">
          {hideCta
            ? "Beta access. All features enabled for testing."
            : ctaMode === "upgrade"
              ? "Preview mode. No charges until billing launches."
              : "Pricing may change during early access."}
        </p>
      )}
    </>
  );
}
