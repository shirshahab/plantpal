"use client";

import Link from "next/link";
import { Sparkles, Crown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/lib/store/subscription-provider";
import { TIER_LABELS } from "@/lib/subscription/types";
import { buildSubscriptionPlans } from "@/lib/subscription/plans";

export function AccountTierCard() {
  const { tier, plantCount, plantLimit, plantsRemaining, betaUnlockAll, subscription } =
    useSubscription();
  const plan = buildSubscriptionPlans(subscription.billingCycle).find((p) => p.id === tier);

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
                {betaUnlockAll ? "Beta — all features unlocked" : "Manage plan & usage"}
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
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={tier === "free" ? "outline" : "success"}>{TIER_LABELS[tier]}</Badge>
          {betaUnlockAll && (
            <Badge variant="outline" className="text-amber-700 border-amber-200">
              Beta Plus
            </Badge>
          )}
          {plan && plan.price !== "$0" && (
            <span className="text-sm text-gray-500">
              {plan.price}
              {plan.period}
            </span>
          )}
        </div>
        {plantLimit !== null && (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{plantCount}</span> of{" "}
            <span className="font-medium text-gray-900">{plantLimit}</span> plants used
            {plantsRemaining !== null && plantsRemaining > 0 && (
              <span className="text-gray-400"> · {plantsRemaining} remaining</span>
            )}
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
