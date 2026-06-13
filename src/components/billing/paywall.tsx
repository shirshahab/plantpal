"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  LAUNCH_TRIAL_DAYS,
  PAYWALL_BENEFITS,
  STORE_COMPLIANCE_LINES,
  TRIAL_LEGAL_COPY,
} from "@/lib/billing/pricing";
import {
  getPurchasePlatform,
  getWebPurchaseUnavailableMessage,
  isMockPurchaseAllowed,
  isPurchaseConfigured,
  restorePurchasesFlow,
  startPurchaseForTier,
} from "@/lib/billing/purchase-adapter";
import { applyVerifiedSubscription } from "@/lib/billing/subscription-state";
import { buildPaywallPlans } from "@/lib/subscription/plans";
import { AccountTier } from "@/lib/billing/tier-config";
import type { BillingCycle } from "@/lib/types/billing";
import { useSubscription } from "@/lib/store/subscription-provider";

interface PaywallProps {
  compact?: boolean;
  showSecondaryLink?: boolean;
}

type PaidTier = typeof AccountTier.PLUS | typeof AccountTier.FAMILY;

const PURCHASE_ERROR =
  "Purchase did not go through. Your plants are still innocent. Try again.";

export function Paywall({ compact = false, showSecondaryLink = true }: PaywallProps) {
  const { trialActive, trialDaysLeft, setTier, refreshSubscription } = useSubscription();
  const plans = buildPaywallPlans();
  const platform = getPurchasePlatform();
  const storeConfigured = isPurchaseConfigured();
  const webPreview = platform === "web" || platform === "unknown";

  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  const handlePurchaseResult = useCallback(
    (result: Awaited<ReturnType<typeof startPurchaseForTier>>) => {
      if (result.unavailableReason) {
        setUnavailable(result.unavailableReason);
        return;
      }
      if (!result.ok || !result.subscription) {
        setError(result.error ?? PURCHASE_ERROR);
        return;
      }
      applyVerifiedSubscription(result.subscription);
      refreshSubscription();
      setError(null);
      setUnavailable(null);
    },
    [refreshSubscription]
  );

  async function handleSelect(tier: PaidTier, cycle: BillingCycle) {
    setError(null);
    setUnavailable(null);
    const key = `${tier}-${cycle}`;
    setLoadingKey(key);

    try {
      if (webPreview) {
        if (isMockPurchaseAllowed()) {
          setTier(tier, cycle);
          return;
        }
        setUnavailable(getWebPurchaseUnavailableMessage());
        return;
      }

      const result = await startPurchaseForTier(tier, cycle);
      handlePurchaseResult(result);
    } catch {
      setError(PURCHASE_ERROR);
    } finally {
      setLoadingKey(null);
    }
  }

  async function handleRestore() {
    setError(null);
    setUnavailable(null);
    setRestoring(true);

    try {
      if (webPreview) {
        setUnavailable(getWebPurchaseUnavailableMessage());
        return;
      }

      const result = await restorePurchasesFlow();
      handlePurchaseResult(result);
    } catch {
      setError(PURCHASE_ERROR);
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className={cn("space-y-6", compact && "space-y-4")}>
      <div className={cn("text-center", compact ? "px-2" : "px-4")}>
        <h2 className={cn("font-bold text-gray-900", compact ? "text-xl" : "text-2xl")}>
          Stop killing your plants.
        </h2>
        <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
          Try every PlantPal feature free for {LAUNCH_TRIAL_DAYS} days. Scan plants, fix problems,
          follow care plans, and keep the drama leafy.
        </p>
        {trialActive && trialDaysLeft != null && (
          <p className="text-xs text-green-700 font-medium mt-2">
            {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left in your free trial.
          </p>
        )}
        {webPreview && !isMockPurchaseAllowed() && (
          <p className="text-xs text-amber-700 mt-2 max-w-md mx-auto">
            {getWebPurchaseUnavailableMessage()}
          </p>
        )}
        {!webPreview && !storeConfigured && (
          <p className="text-xs text-amber-700 mt-2 max-w-md mx-auto">
            Store billing is not configured yet. Complete RevenueCat setup in the mobile app.
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center max-w-md mx-auto" role="alert">
          {error}
        </p>
      )}
      {unavailable && (
        <p className="text-sm text-amber-700 text-center max-w-md mx-auto" role="status">
          {unavailable}
        </p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
        {PAYWALL_BENEFITS.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {plans.map((plan) => {
          const key = `${plan.tier}-${plan.cycle}`;
          const loading = loadingKey === key;
          return (
            <Card
              key={key}
              padding="md"
              className={cn(
                "border",
                plan.featured ? "border-green-300 ring-1 ring-green-200" : "border-gray-100"
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-500">{plan.period}</span>
              </div>
              {plan.subline && <p className="text-xs text-green-700 mt-1">{plan.subline}</p>}
              <p className="text-xs text-gray-500 mt-2">
                {LAUNCH_TRIAL_DAYS} days free, then {plan.price}
                {plan.period}.
              </p>
              <Button
                className="w-full mt-4 touch-manipulation"
                variant={plan.featured ? "primary" : "outline"}
                disabled={loading || restoring}
                onClick={() => handleSelect(plan.tier, plan.cycle)}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Start {LAUNCH_TRIAL_DAYS}-day free trial
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={handleRestore}
          disabled={restoring || Boolean(loadingKey)}
          className="text-sm text-green-700 font-medium hover:underline disabled:opacity-50 inline-flex items-center gap-2"
        >
          {restoring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Restore purchase
        </button>
      </div>

      <div className="max-w-xl mx-auto space-y-2 text-xs text-gray-500 leading-relaxed">
        <p className="text-center font-medium text-gray-600">
          14 days free. Your plants get legal representation immediately.
        </p>
        <p className="text-center">Cancel anytime.</p>
        <p className="text-center">{TRIAL_LEGAL_COPY}</p>
        <ul className="list-disc pl-5 space-y-1 pt-2">
          {STORE_COMPLIANCE_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      {showSecondaryLink && (
        <p className="text-center text-sm">
          <Link href="/settings/subscription" className="text-green-700 font-medium hover:underline">
            See plans
          </Link>
        </p>
      )}
    </div>
  );
}
