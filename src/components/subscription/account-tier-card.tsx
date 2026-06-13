"use client";

import Link from "next/link";
import { Sparkles, Crown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BetaAccessBanner } from "@/components/billing/beta-access-banner";
import { useSubscription } from "@/lib/store/subscription-provider";
import { TIER_LABELS } from "@/lib/subscription/types";
import { buildSubscriptionPlans } from "@/lib/subscription/plans";
import { getEffectivePlanLabel, isDevUnlockAllFeatures } from "@/lib/billing/beta-unlock";

export function AccountTierCard() {
  const { tier, plantCount, plantLimit, plantsRemaining, betaUnlockAll, founderMode, subscription } =
    useSubscription();
  const plan = buildSubscriptionPlans(subscription.billingCycle).find((p) => p.id === tier);
  const planLabel = getEffectivePlanLabel(TIER_LABELS[tier], {
    founderMode,
    unrestricted: betaUnlockAll && !founderMode,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
              <Crown className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Subscription</h2>
              <p className="text-sm text-gray-500">
                {founderMode
                  ? "Founder Mode Active"
                  : isDevUnlockAllFeatures()
                    ? "Dev unlock active"
                    : "Manage plan & usage"}
              </p>
            </div>
          </div>
          <Link href="/settings/subscription">
            <Button variant="ghost" size="sm" className="touch-manipulation">
              View
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {betaUnlockAll && <BetaAccessBanner compact />}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={betaUnlockAll || tier !== "free" ? "success" : "outline"}>
            {planLabel}
          </Badge>
          {!betaUnlockAll && plan && plan.price !== "$0" && (
            <span className="text-sm text-gray-500">
              {plan.price}
              {plan.period}
            </span>
          )}
        </div>
        {plantLimit !== null && !betaUnlockAll ? (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{plantCount}</span> of{" "}
            <span className="font-medium text-gray-900">{plantLimit}</span> plants used
            {plantsRemaining !== null && plantsRemaining > 0 && (
              <span className="text-gray-400"> · {plantsRemaining} remaining</span>
            )}
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{plantCount}</span> plants · Unlimited
          </p>
        )}
        {!betaUnlockAll && tier === "free" && (
          <Link href="/upgrade">
            <Button className="w-full sm:w-auto touch-manipulation">
              <Sparkles className="w-4 h-4" />
              Upgrade to Plus
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
