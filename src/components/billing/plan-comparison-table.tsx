"use client";

import type { BillingCycle } from "@/lib/types/billing";
import { AccountTier as Tier } from "@/lib/billing/tier-config";
import { buildSubscriptionPlans } from "@/lib/subscription/plans";
import { OFFICIAL_PRICING } from "@/lib/billing/pricing";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const COMPARISON_ROWS: {
  label: string;
  free: boolean | string;
  pro: boolean | string;
}[] = [
  { label: "Scans per month", free: "20", pro: "Unlimited" },
  { label: "Plants tracked", free: "Up to 25", pro: "Unlimited" },
  { label: "Academy basics", free: true, pro: true },
  { label: "Full Academy paths", free: false, pro: true },
  { label: "Advanced diagnosis", free: false, pro: true },
  { label: "Garden Designer", free: false, pro: true },
  { label: "Seasonal courses", free: false, pro: true },
  { label: "Export reports", free: false, pro: true },
  { label: "Climate intelligence", free: false, pro: true },
  { label: "Price Checker", free: false, pro: true },
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
  const proPlan = plans.find((p) => p.id === Tier.PLUS)!;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="p-4 text-sm font-semibold text-gray-900">Feature</th>
              <th className="p-4 text-sm font-semibold text-gray-900">Free</th>
              <th className="p-4 text-sm font-semibold text-gray-900">
                <div>PlantPal Pro</div>
                <div className="text-xs font-normal text-gray-500 mt-0.5">
                  {proPlan.price}
                  {proPlan.period}
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
                  <CellValue value={row.pro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {billingCycle === "annual" && (
        <p className="text-center text-sm text-green-700 font-medium">
          Save {OFFICIAL_PRICING.pro.annualSavingsPercent}% annually on Pro vs monthly billing
        </p>
      )}
    </div>
  );
}
