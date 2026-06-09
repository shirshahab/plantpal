"use client";

import type { BillingCycle } from "@/lib/types/billing";
import { AccountTier as Tier } from "@/lib/billing/tier-config";
import { buildSubscriptionPlans } from "@/lib/subscription/plans";
import { OFFICIAL_PRICING } from "@/lib/billing/pricing";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const COMPARISON_ROWS: { label: string; free: boolean | string; plus: boolean | string; family: boolean | string }[] = [
  { label: "Plants tracked", free: "Up to 3", plus: "Unlimited", family: "Unlimited" },
  { label: "AI Plant Doctor", free: false, plus: true, family: true },
  { label: "AI Care Plans", free: false, plus: true, family: true },
  { label: "Climate Intelligence", free: false, plus: true, family: true },
  { label: "Price Checker", free: false, plus: true, family: true },
  { label: "Plant Genome", free: false, plus: true, family: true },
  { label: "Plant Scanner", free: false, plus: true, family: true },
  { label: "Landscape Designer", free: false, plus: false, family: true },
  { label: "Concierge Plans", free: false, plus: false, family: true },
  { label: "Multiple properties", free: false, plus: false, family: true },
  { label: "Household sharing", free: false, plus: false, family: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-gray-700">{value}</span>;
  }
  return value ? (
    <Check className="w-4 h-4 text-green-600 mx-auto" aria-label="Included" />
  ) : (
    <Minus className="w-4 h-4 text-gray-300 mx-auto" aria-label="Not included" />
  );
}

interface PlanComparisonTableProps {
  billingCycle?: BillingCycle;
  className?: string;
}

export function PlanComparisonTable({ billingCycle = "monthly", className }: PlanComparisonTableProps) {
  const plans = buildSubscriptionPlans(billingCycle);
  const plusPlan = plans.find((p) => p.id === Tier.PLUS)!;
  const familyPlan = plans.find((p) => p.id === Tier.FAMILY)!;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="p-4 text-sm font-semibold text-gray-900">Feature</th>
              <th className="p-4 text-sm font-semibold text-gray-900">Free</th>
              <th className="p-4 text-sm font-semibold text-gray-900">
                <div>Plus</div>
                <div className="text-xs font-normal text-gray-500 mt-0.5">
                  {plusPlan.price}
                  {plusPlan.period}
                </div>
              </th>
              <th className="p-4 text-sm font-semibold text-gray-900">
                <div>Family</div>
                <div className="text-xs font-normal text-gray-500 mt-0.5">
                  {familyPlan.price}
                  {familyPlan.period}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-gray-50 last:border-0">
                <td className="p-4 text-sm text-gray-600">{row.label}</td>
                <td className="p-4 text-center">
                  <CellValue value={row.free} />
                </td>
                <td className="p-4 text-center bg-green-50/30">
                  <CellValue value={row.plus} />
                </td>
                <td className="p-4 text-center">
                  <CellValue value={row.family} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {billingCycle === "annual" && (
        <p className="text-center text-sm text-green-700 font-medium">
          Save {OFFICIAL_PRICING.plus.annualSavingsPercent}% annually on Plus ·{" "}
          {OFFICIAL_PRICING.family.annualSavingsPercent}% on Family vs monthly billing
        </p>
      )}
    </div>
  );
}
