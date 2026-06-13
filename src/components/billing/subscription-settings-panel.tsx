"use client";

import Link from "next/link";
import { Sparkles, Crown, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrialBanner } from "@/components/billing/trial-banner";
import { FeatureLockLabel } from "@/components/billing/feature-lock-label";
import { UsageMeters } from "@/components/billing/billing-dashboard";
import { useSubscription } from "@/lib/store/subscription-provider";
import { buildSubscriptionPlans } from "@/lib/subscription/plans";
import { TIER_LABELS } from "@/lib/subscription/types";
import { getEffectivePlanLabel, isDevUnlockAllFeatures } from "@/lib/billing/beta-unlock";
import type { BillingFeature } from "@/lib/billing/feature-gates";

const FEATURE_STATUS_ROWS: { feature: BillingFeature; label: string }[] = [
  { feature: "ai_doctor", label: "Plant Doctor" },
  { feature: "ai_care_plan", label: "PlantPal Care Plans" },
  { feature: "plant_scanner", label: "Plant Scanner" },
  { feature: "price_checker", label: "Price Checker" },
  { feature: "climate_intelligence", label: "Climate Intelligence" },
  { feature: "plant_genome", label: "Plant Genome" },
  { feature: "landscape_designer", label: "Garden Designer" },
  { feature: "concierge", label: "Concierge Plans" },
  { feature: "family_sharing", label: "Family Sharing" },
];

export function SubscriptionSettingsPanel() {
  const {
    tier,
    plantCount,
    plantLimit,
    plantsRemaining,
    canUse,
    subscription,
    betaUnlockAll,
    founderMode,
    usage,
    trialActive,
  } = useSubscription();

  const devUnlock = isDevUnlockAllFeatures();
  const plan = buildSubscriptionPlans(subscription.billingCycle).find((p) => p.id === tier);
  const planLabel = getEffectivePlanLabel(TIER_LABELS[tier], {
    founderMode,
    unrestricted: devUnlock && !founderMode,
    trialActive,
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <TrialBanner />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
              <Crown className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Subscription</h2>
              <p className="text-sm text-gray-500">
                {trialActive
                  ? "Free trial: all features unlocked"
                  : tier === "free"
                    ? "Free plan with limits on scans and plants"
                    : "Active paid plan"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={trialActive || tier !== "free" ? "success" : "outline"}>
                  {planLabel}
                </Badge>
              </div>
              {!devUnlock && plan && plan.price !== "$0" && (
                <p className="text-sm text-gray-600 mt-2">
                  {plan.price}
                  {plan.period}
                  {subscription.billingCycle === "annual" && plan.annualPeriod && (
                    <span className="text-gray-400"> · {plan.annualPeriod}</span>
                  )}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Plants used</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {plantCount}
                {plantLimit !== null && !trialActive && !devUnlock ? ` / ${plantLimit}` : " · Unlimited"}
              </p>
              {plantsRemaining !== null && plantsRemaining > 0 && !trialActive && !devUnlock && (
                <p className="text-xs text-gray-500 mt-1">{plantsRemaining} remaining on Free</p>
              )}
            </div>
          </div>

          {!trialActive && !devUnlock && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Monthly usage</p>
              <UsageMeters usage={usage} />
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Feature access</p>
            <ul className="space-y-2">
              {FEATURE_STATUS_ROWS.map(({ feature, label }) => {
                const unlocked = canUse(feature);
                return (
                  <li
                    key={feature}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
                  >
                    <span className="text-sm text-gray-800">{label}</span>
                    {unlocked ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        Included
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-gray-400">Locked</span>
                        <FeatureLockLabel feature={feature} />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {!devUnlock && tier === "free" && !trialActive && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/upgrade">
                <Button className="w-full sm:w-auto touch-manipulation">
                  <Sparkles className="w-4 h-4" />
                  Start 14-day free trial
                </Button>
              </Link>
              <Link href="/billing">
                <Button variant="outline" className="w-full sm:w-auto">
                  Billing & usage
                </Button>
              </Link>
            </div>
          )}

          {!devUnlock && tier !== "free" && (
            <Link href="/upgrade">
              <Button variant="outline" size="sm">
                Change plan
              </Button>
            </Link>
          )}

          {devUnlock && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
              Dev unlock is enabled. All features open for local testing.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
