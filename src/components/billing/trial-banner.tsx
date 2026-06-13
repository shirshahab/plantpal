"use client";

import Link from "next/link";
import { Clock, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useSubscription } from "@/lib/store/subscription-provider";
import { trialEndsLabel } from "@/lib/billing/trial";

/** Trial countdown for dashboard and settings. */
export function TrialBanner({ dismissible = false }: { dismissible?: boolean }) {
  const { trialActive, trialDaysLeft, subscription } = useSubscription();

  if (!trialActive || trialDaysLeft == null) return null;

  const endLabel = trialEndsLabel(subscription);

  return (
    <Card padding="md" className="border-green-200 bg-green-50/70 relative">
      {dismissible && (
        <button
          type="button"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-green-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">
            Trial: {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left
          </p>
          {endLabel && (
            <p className="text-sm text-gray-600 mt-0.5">
              Your free trial ends on {endLabel}.
            </p>
          )}
          <p className="text-xs text-green-800 mt-1">
            Your plants have {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} of full legal
            coverage.
          </p>
          <Link
            href="/upgrade"
            className="inline-block text-sm font-medium text-green-700 hover:text-green-800 mt-2"
          >
            See plans before trial ends
          </Link>
        </div>
      </div>
    </Card>
  );
}
