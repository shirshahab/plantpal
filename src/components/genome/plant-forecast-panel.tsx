"use client";

import { useState } from "react";
import {
  Calendar,
  Flower2,
  AlertTriangle,
  Scissors,
  Thermometer,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ForecastItem } from "@/lib/genome";
import { formatDate } from "@/lib/utils";

const TABS = [
  { id: "30" as const, label: "Next 30 days" },
  { id: "90" as const, label: "Next 90 days" },
  { id: "season" as const, label: "Next season" },
];

const CATEGORY_ICON: Record<string, React.ElementType> = {
  flowering: Flower2,
  fruiting: Sparkles,
  heat_stress: Thermometer,
  frost_risk: AlertTriangle,
  repotting: Calendar,
  pruning: Scissors,
  watering: Calendar,
  fertilizing: Sparkles,
  dormancy: Calendar,
  milestone: Sparkles,
};

function ForecastCard({ item }: { item: ForecastItem }) {
  const Icon = CATEGORY_ICON[item.category] ?? Calendar;
  const confidenceColor =
    item.confidence === "high"
      ? "text-green-600 bg-green-50"
      : item.confidence === "medium"
        ? "text-amber-600 bg-amber-50"
        : "text-gray-500 bg-gray-50";

  return (
    <div className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-white">
      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", confidenceColor)}>
            {item.confidence}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.description}</p>
        <p className="text-[10px] text-gray-400 mt-1.5">
          {formatDate(item.windowStart)} — {formatDate(item.windowEnd)}
        </p>
      </div>
    </div>
  );
}

export function PlantForecastPanel({
  forecast30,
  forecast90,
  forecastSeason,
  milestones,
}: {
  forecast30: ForecastItem[];
  forecast90: ForecastItem[];
  forecastSeason: ForecastItem[];
  milestones: ForecastItem[];
}) {
  const [tab, setTab] = useState<"30" | "90" | "season">("30");

  const items =
    tab === "30" ? forecast30 : tab === "90" ? forecast90 : forecastSeason;

  return (
    <Card padding="md" className="border-indigo-100/60">
      <CardHeader className="pb-2">
        <h3 className="text-base font-semibold text-gray-900">Plant Forecast</h3>
        <p className="text-xs text-gray-500 mt-1">
          Estimated from the species calendar and your plant&apos;s history.
        </p>
        <div className="flex gap-1 mt-3 p-1 bg-gray-100 rounded-xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 text-xs font-medium py-2 px-2 rounded-lg transition-colors touch-manipulation",
                tab === t.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No forecast items for this window yet. Add photos and growth data to improve predictions.
          </p>
        ) : (
          items.map((item) => <ForecastCard key={item.id} item={item} />)
        )}

        {milestones.length > 0 && tab === "30" && (
          <div className="pt-3 border-t border-gray-100 mt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Upcoming milestones
            </p>
            <div className="space-y-2">
              {milestones.slice(0, 3).map((m) => (
                <ForecastCard key={m.id} item={m} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
