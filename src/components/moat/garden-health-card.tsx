"use client";

import { Card } from "@/components/ui/card";
import { HealthScoreRing } from "@/components/score/health-score-badge";
import type { GardenHealthBreakdown } from "@/lib/moat/garden-health";
import { MoatProgressBar } from "./moat-progress";

export function GardenHealthCard({ health }: { health: GardenHealthBreakdown }) {
  return (
    <Card padding="md" className="bg-gradient-to-br from-emerald-50 via-white to-green-50 border-green-100">
      <div className="flex items-center gap-4">
        <div className="relative">
          <HealthScoreRing score={health.score} size={80} />
          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-900">
            {health.score}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
            Garden Health
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">
            {health.score}
            <span className="text-sm font-normal text-gray-400">/100</span>
          </p>
          <p className="text-sm text-gray-600">{health.label}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-green-100 space-y-3">
        {[
          { label: "Watering consistency", value: health.wateringConsistency },
          { label: "Plant health", value: health.plantHealth },
          { label: "Tasks completed", value: health.tasksCompleted },
          { label: "Growth tracking", value: health.growthTracking },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-semibold text-gray-700">{row.value}%</span>
            </div>
            <MoatProgressBar value={row.value} max={100} />
          </div>
        ))}
      </div>
    </Card>
  );
}
