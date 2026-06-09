"use client";

import { Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BudgetOption, BudgetTier } from "@/lib/landscape/types";
import { BUDGET_TIER_LABELS } from "@/lib/landscape/types";

interface BudgetOptionCardsProps {
  options: BudgetOption[];
  selected?: BudgetTier;
  onSelect?: (tier: BudgetTier) => void;
}

const TIER_STYLES: Record<BudgetTier, string> = {
  budget: "border-gray-200",
  balanced: "border-green-300 ring-1 ring-green-500/20",
  premium: "border-amber-200",
};

export function BudgetOptionCards({
  options,
  selected,
  onSelect,
}: BudgetOptionCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {options.map((opt) => {
        const isSelected = selected === opt.tier;
        const isBalanced = opt.tier === "balanced";
        return (
          <Card
            key={opt.tier}
            padding="md"
            className={cn(
              "flex flex-col cursor-pointer transition-all",
              TIER_STYLES[opt.tier],
              isSelected && "ring-2 ring-green-500/40",
              onSelect && "hover:border-green-300"
            )}
            onClick={() => onSelect?.(opt.tier)}
          >
              {isBalanced && (
              <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full w-fit mb-2">
                Recommended
              </span>
            )}
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-gray-900">{BUDGET_TIER_LABELS[opt.tier]}</p>
              {isSelected && <Check className="w-4 h-4 text-green-600 shrink-0" />}
            </div>
            <p className="text-lg font-bold text-gray-900 mt-1">{opt.estimated_cost}</p>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{opt.summary}</p>
            <ul className="mt-4 space-y-1.5 flex-1">
              {opt.plant_list.map((item) => (
                <li key={item} className="text-sm text-gray-700 flex gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
              {opt.highlights.map((h) => (
                <span
                  key={h}
                  className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full"
                >
                  {h}
                </span>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
