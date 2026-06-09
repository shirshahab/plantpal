"use client";

import { Card } from "@/components/ui/card";
import { HealthScoreBadge } from "@/components/score/health-score-badge";
import type { ZonePlantPlacement } from "@/lib/moat/garden-map-types";
import { Sun, Droplets, FlaskConical } from "lucide-react";

const SUN_LABELS = {
  full_sun: "Full sun",
  partial_sun: "Partial sun",
  shade: "Shade",
};

export function PlantPlacementCard({ placement }: { placement: ZonePlantPlacement }) {
  return (
    <Card padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{placement.label}</p>
          <HealthScoreBadge score={placement.healthScore} size="sm" />
        </div>
        <span className="text-2xl">🌿</span>
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-gray-600">
        <p className="flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          {SUN_LABELS[placement.sunExposure]}
        </p>
        <p className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-sky-500" />
          {placement.waterSchedule}
        </p>
        <p className="flex items-center gap-1.5">
          <FlaskConical className="w-3.5 h-3.5 text-purple-500" />
          {placement.fertilizerSchedule}
        </p>
      </div>
    </Card>
  );
}
