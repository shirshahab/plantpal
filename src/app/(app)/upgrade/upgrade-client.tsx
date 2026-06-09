"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { BetaAccessBanner } from "@/components/billing/beta-access-banner";
import { PlanCards } from "@/components/subscription/plan-cards";
import { PlanComparisonTable } from "@/components/billing/plan-comparison-table";
import { UsageMeters } from "@/components/billing/billing-dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/lib/store/subscription-provider";
import { useToast } from "@/lib/store/toast-provider";
import type { AccountTier } from "@/lib/billing/tier-config";
import type { BillingCycle } from "@/lib/types/billing";
import { TIER_LABELS } from "@/lib/subscription/types";
import { OFFICIAL_PRICING, PRO_FEATURE_HIGHLIGHTS } from "@/lib/billing/pricing";

const FEATURE_MESSAGES: Record<string, { title: string; body: string }> = {
  "landscape-designer": {
    title: "Landscape AI is a Pro feature",
    body: "Upload yard photos and get climate-matched planting plans with PlantPal Pro.",
  },
  "design-studio": {
    title: "Design Studio requires Pro",
    body: "Generate AI yard concepts and shopping lists with a Pro subscription.",
  },
  seasonal: {
    title: "Seasonal courses are Pro-only",
    body: "Get location-aware seasonal care tasks and courses with PlantPal Pro.",
  },
  concierge: {
    title: "Concierge requires Pro",
    body: "Guided recovery plans for struggling plants are included in Pro.",
  },
};

export default function UpgradePageClient() {
  const {
    tier,
    setTier,
    plantCount,
    plantLimit,
    canAddPlant,
    canScan,
    scansRemaining,
    scanLimit,
    scansUsed,
    usage,
    betaUnlockAll,
  } = useSubscription();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const blockedFeature = searchParams.get("feature");
  const featureMsg = blockedFeature ? FEATURE_MESSAGES[blockedFeature] : null;

  useEffect(() => {
    if (blockedFeature && !betaUnlockAll && tier === "free") {
      toast(featureMsg?.title ?? "This feature requires PlantPal Pro");
    }
  }, [blockedFeature, betaUnlockAll, tier, featureMsg, toast]);

  function handleSelectPlan(selected: AccountTier, cycle: BillingCycle) {
    setTier(selected, cycle);
    toast(`You're now on ${TIER_LABELS[selected]} (preview — no charge).`);
    if (selected !== "free") {
      router.push("/billing");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-8">
      <PageHeader
        title="Upgrade to PlantPal Pro"
        description={
          betaUnlockAll
            ? "Beta access is active — all Pro features are unlocked for testing."
            : `$${OFFICIAL_PRICING.pro.monthly.toFixed(2)}/month · unlimited scans, plants, and AI tools`
        }
      />

      {betaUnlockAll && <BetaAccessBanner />}

      {featureMsg && !betaUnlockAll && tier === "free" && (
        <Card padding="md" className="border-green-200 bg-green-50">
          <p className="font-semibold text-gray-900">{featureMsg.title}</p>
          <p className="text-sm text-gray-600 mt-1">{featureMsg.body}</p>
          <Link href="/billing" className="inline-block mt-3">
            <Button size="sm" variant="outline">
              View current usage
            </Button>
          </Link>
        </Card>
      )}

      {!betaUnlockAll && tier === "free" && (
        <Card padding="md" className="space-y-4">
          <p className="text-sm font-semibold text-gray-900">Your Free usage</p>
          <UsageMeters usage={usage} />
          {(!canScan() || !canAddPlant()) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {!canScan() && scanLimit !== null && (
                <p>You&apos;ve used all {scanLimit} scans this month ({scansUsed} used).</p>
              )}
              {!canAddPlant() && plantLimit !== null && (
                <p className={!canScan() ? "mt-1" : ""}>
                  You&apos;ve reached the {plantLimit}-plant limit ({plantCount} plants).
                </p>
              )}
              {scansRemaining !== null && scansRemaining > 0 && canScan() && (
                <p className="text-gray-700">{scansRemaining} scans left this month.</p>
              )}
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRO_FEATURE_HIGHLIGHTS.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700"
          >
            <Sparkles className="w-4 h-4 text-green-600 shrink-0" />
            {item}
          </div>
        ))}
      </div>

      {billingCycle === "annual" && !betaUnlockAll && (
        <p className="text-center text-sm font-medium text-green-700 bg-green-50 rounded-xl py-3 px-4">
          Save {OFFICIAL_PRICING.pro.annualSavingsPercent}% annually vs monthly billing
        </p>
      )}

      <PlanCards
        currentTier={tier}
        onSelectPlan={handleSelectPlan}
        ctaMode="upgrade"
        billingCycle={billingCycle}
        onBillingCycleChange={setBillingCycle}
        hideUpgradePrompts={betaUnlockAll}
        plansFilter={["free", "plus"]}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 text-center">Free vs Pro</h2>
        <PlanComparisonTable billingCycle={billingCycle} />
      </section>
    </div>
  );
}
