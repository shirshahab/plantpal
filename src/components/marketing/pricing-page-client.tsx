"use client";

import { useState } from "react";
import { PlanCards } from "@/components/subscription/plan-cards";
import { PlanComparisonTable } from "@/components/billing/plan-comparison-table";
import { OFFICIAL_PRICING } from "@/lib/billing/pricing";
import type { BillingCycle } from "@/lib/types/billing";

export default function PricingPageClient() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <>
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-sm font-medium text-brand-primary uppercase tracking-wide mb-3 font-heading">
          Pricing
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-text tracking-tight">
          Simple plans for every garden
        </h1>
        <p className="text-brand-text-secondary mt-4 leading-relaxed">
          Start free with up to 3 plants. Upgrade for AI diagnosis, unlimited tracking, and
          full-property tools for households.
        </p>
        {billingCycle === "annual" && (
          <p className="text-sm font-medium text-green-700 mt-4">
            Save up to {OFFICIAL_PRICING.pro.annualSavingsPercent}% with annual billing on Pro
          </p>
        )}
      </div>

      <PlanCards
        ctaMode="waitlist"
        billingCycle={billingCycle}
        onBillingCycleChange={setBillingCycle}
      />

      <section className="mt-16 space-y-4">
        <h2 className="text-xl font-semibold text-brand-text text-center">Full comparison</h2>
        <PlanComparisonTable billingCycle={billingCycle} />
      </section>
    </>
  );
}
