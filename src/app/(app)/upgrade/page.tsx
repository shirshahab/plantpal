"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BetaAccessBanner } from "@/components/billing/beta-access-banner";
import { PlanCards } from "@/components/subscription/plan-cards";
import { PlanComparisonTable } from "@/components/billing/plan-comparison-table";
import { useSubscription } from "@/lib/store/subscription-provider";
import { useToast } from "@/lib/store/toast-provider";
import type { AccountTier } from "@/lib/billing/tier-config";
import type { BillingCycle } from "@/lib/types/billing";
import { TIER_LABELS } from "@/lib/subscription/types";
import { OFFICIAL_PRICING } from "@/lib/billing/pricing";

export default function UpgradePage() {
  const { tier, setTier, plantCount, plantLimit, canAddPlant, betaUnlockAll } = useSubscription();
  const { toast } = useToast();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  function handleSelectPlan(selected: AccountTier, cycle: BillingCycle) {
    setTier(selected, cycle);
    toast(`You're now on ${TIER_LABELS[selected]} (preview — no charge).`);
    if (selected !== "free") {
      router.push("/dashboard");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Upgrade PlantPal"
        description={
          betaUnlockAll
            ? "Beta access is active — all features are unlocked for testing."
            : "Choose the plan that fits your garden. Billing is not active yet — this is a preview."
        }
      />

      {betaUnlockAll && <BetaAccessBanner />}

      {!betaUnlockAll && !canAddPlant() && plantLimit !== null && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center">
          <p className="font-semibold text-gray-900">
            You have reached the free limit of {plantLimit} plants.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Unlock unlimited plants with Plus — you currently have {plantCount} plants.
          </p>
        </div>
      )}

      {billingCycle === "annual" && !betaUnlockAll && (
        <p className="text-center text-sm font-medium text-green-700 bg-green-50 rounded-xl py-3 px-4">
          Save {OFFICIAL_PRICING.plus.annualSavingsPercent}% annually on Plus compared to monthly billing
        </p>
      )}

      <PlanCards
        currentTier={tier}
        onSelectPlan={handleSelectPlan}
        ctaMode="upgrade"
        billingCycle={billingCycle}
        onBillingCycleChange={setBillingCycle}
        hideUpgradePrompts={betaUnlockAll}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 text-center">Compare plans</h2>
        <PlanComparisonTable billingCycle={billingCycle} />
      </section>
    </div>
  );
}
