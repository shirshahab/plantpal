"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlanCards } from "@/components/subscription/plan-cards";
import { PlanComparisonTable } from "@/components/billing/plan-comparison-table";
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
          Free during public beta
        </h1>
        <p className="text-brand-text-secondary mt-4 leading-relaxed">
          Every feature is unlocked for everyone right now — no limits, no paywalls.
          PlantPal Pro coming soon.
        </p>
        <Link href="/onboarding" className="inline-block mt-6">
          <Button size="lg">Get Started Free</Button>
        </Link>
      </div>

      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-xl font-semibold text-brand-text">What plans will look like</h2>
        <p className="text-sm text-brand-text-secondary mt-2">
          A preview of future pricing — nothing is gated today.
        </p>
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
