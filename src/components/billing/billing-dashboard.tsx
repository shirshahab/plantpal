"use client";

import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/lib/store/subscription-provider";
import { TIER_LABELS } from "@/lib/billing/tier-config";
import { PRO_MONTHLY_PRICE } from "@/lib/billing/pricing";
import { getEffectivePlanLabel } from "@/lib/billing/beta-unlock";
import type { UsageSummary } from "@/lib/billing/usage-tracking";
import { cn } from "@/lib/utils";

function UsageBar({
  label,
  used,
  limit,
  remaining,
}: {
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
}) {
  const unlimited = limit === null;
  const pct = unlimited ? 100 : limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const nearLimit = !unlimited && limit !== null && remaining !== null && remaining <= 3;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-gray-800">{label}</span>
        <span className={cn("text-gray-500", nearLimit && "text-amber-700 font-medium")}>
          {unlimited ? `${used} used · Unlimited` : `${used} / ${limit} used`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            unlimited ? "bg-green-500" : nearLimit ? "bg-amber-500" : "bg-green-500"
          )}
          style={{ width: unlimited ? "100%" : `${pct}%` }}
        />
      </div>
      {!unlimited && remaining !== null && (
        <p className="text-xs text-gray-400 mt-1">{remaining} remaining this month</p>
      )}
    </div>
  );
}

export function UsageMeters({
  usage,
  className,
}: {
  usage: UsageSummary;
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)}>
      <UsageBar
        label="Plant scans"
        used={usage.scansUsed}
        limit={usage.scanLimit}
        remaining={usage.scansRemaining}
      />
      <UsageBar
        label="Plants in garden"
        used={usage.plantsUsed}
        limit={usage.plantLimit}
        remaining={usage.plantsRemaining}
      />
    </div>
  );
}

export function BillingDashboard() {
  const {
    tier,
    subscription,
    usage,
    betaUnlockAll,
    founderMode,
    canUse,
  } = useSubscription();

  const planLabel = getEffectivePlanLabel(TIER_LABELS[tier], {
    founderMode,
    unrestricted: betaUnlockAll && !founderMode,
  });

  const proFeatures = [
    { key: "unlimited_scans", label: "Unlimited scans" },
    { key: "unlimited_plants", label: "Unlimited plants" },
    { key: "advanced_diagnosis", label: "Advanced diagnosis" },
    { key: "landscape_ai", label: "Garden Designer" },
    { key: "full_academy", label: "Full Academy" },
    { key: "seasonal_courses", label: "Seasonal courses" },
    { key: "export_reports", label: "Export reports" },
  ] as const;

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                <Crown className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Current plan</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={tier === "free" && !betaUnlockAll ? "outline" : "success"}>
                    {planLabel}
                  </Badge>
                  {subscription.trialStatus === "active" && (
                    <Badge variant="info">Trial active</Badge>
                  )}
                </div>
              </div>
            </div>
            {tier === "free" && !betaUnlockAll && (
              <Link href="/upgrade">
                <Button size="sm" className="touch-manipulation">
                  <Sparkles className="w-4 h-4" />
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!betaUnlockAll && (
            <>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Usage this month</p>
                <UsageMeters usage={usage} />
              </div>
              <p className="text-xs text-gray-400">
                Usage resets on the 1st of each month. Scans and plant limits apply to Free accounts.
              </p>
            </>
          )}

          {betaUnlockAll && (
            <p className="text-sm text-amber-800 bg-amber-50 rounded-xl px-4 py-3">
              Dev / founder access. Limits are bypassed for testing.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">PlantPal Pro</h2>
          <p className="text-sm text-gray-500 mt-1">
            ${PRO_MONTHLY_PRICE.toFixed(2)}/month · unlimited scans & plants
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {proFeatures.map(({ key, label }) => {
              const unlocked = betaUnlockAll || canUse(key);
              return (
                <li
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 text-sm"
                >
                  <span className="text-gray-800">{label}</span>
                  <span className={unlocked ? "text-green-700 font-medium" : "text-gray-400"}>
                    {unlocked ? "Included" : "Pro"}
                  </span>
                </li>
              );
            })}
          </ul>
          {tier === "free" && !betaUnlockAll && (
            <Link href="/upgrade">
              <Button className="w-full touch-manipulation">
                Upgrade to PlantPal Pro: ${PRO_MONTHLY_PRICE.toFixed(2)}/mo
              </Button>
            </Link>
          )}
          <Link href="/settings/subscription" className="block text-center text-sm text-green-700 hover:underline">
            Manage subscription details
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
