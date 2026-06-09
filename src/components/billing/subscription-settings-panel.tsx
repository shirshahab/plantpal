"use client";

import Link from "next/link";
import { Sparkles, Crown, Lock, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeatureLockLabel } from "@/components/billing/feature-lock-label";
import { useSubscription } from "@/lib/store/subscription-provider";
import { buildSubscriptionPlans } from "@/lib/subscription/plans";
import { TIER_LABELS } from "@/lib/subscription/types";
import { isBetaUnlockAll } from "@/lib/billing/beta-unlock";
import type { BillingFeature } from "@/lib/billing/feature-gates";

const FEATURE_STATUS_ROWS: { feature: BillingFeature; label: string }[] = [
  { feature: "ai_doctor", label: "AI Doctor" },
  { feature: "ai_care_plan", label: "AI Care Plans" },
  { feature: "price_checker", label: "Price Checker" },
  { feature: "climate_intelligence", label: "Climate Intelligence" },
  { feature: "plant_genome", label: "Plant Genome" },
  { feature: "landscape_designer", label: "Landscape Designer" },
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
  } = useSubscription();

  const plan = buildSubscriptionPlans(subscription.billingCycle).find((p) => p.id === tier);

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
              <Crown className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Subscription</h2>
              <p className="text-sm text-gray-500">
                {betaUnlockAll
                  ? "Beta access — all features unlocked"
                  : "Preview mode — no billing yet"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current plan</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={tier === "free" ? "outline" : "success"}>{TIER_LABELS[tier]}</Badge>
                {betaUnlockAll && (
                  <Badge variant="outline" className="text-amber-700 border-amber-200">
                    Beta Plus
                  </Badge>
                )}
              </div>
              {plan && plan.price !== "$0" && (
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
                {plantLimit !== null ? ` / ${plantLimit}` : " · Unlimited"}
              </p>
              {plantsRemaining !== null && plantsRemaining > 0 && (
                <p className="text-xs text-gray-500 mt-1">{plantsRemaining} remaining on Free</p>
              )}
            </div>
          </div>

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

          {!betaUnlockAll && tier === "free" && (
            <Link href="/upgrade">
              <Button className="w-full sm:w-auto touch-manipulation">
                <Sparkles className="w-4 h-4" />
                Upgrade to Plus
              </Button>
            </Link>
          )}

          {!betaUnlockAll && tier !== "free" && (
            <Link href="/upgrade">
              <Button variant="outline" size="sm">
                Change plan
              </Button>
            </Link>
          )}

          {isBetaUnlockAll() && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              <Lock className="w-3 h-3 inline mr-1" />
              BETA_UNLOCK_ALL is enabled — upgrade prompts are hidden for testers.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
