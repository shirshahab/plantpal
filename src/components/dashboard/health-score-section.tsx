"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HealthScoreRing } from "@/components/score/health-score-badge";
import { MoatProgressBar } from "@/components/moat/moat-progress";
import type { GardenHealthBreakdown } from "@/lib/moat/garden-health";
import type { Plant } from "@/lib/types";

interface DashboardHealthScoreProps {
  health: GardenHealthBreakdown;
  plants: Plant[];
}

export function DashboardHealthScore({ health, plants }: DashboardHealthScoreProps) {
  const needsAttention = plants.filter(
    (p) => p.healthStatus === "needs_attention" || p.healthStatus === "critical"
  ).length;

  const statusLine =
    needsAttention === 0
      ? "Your garden is thriving — keep up the great care!"
      : needsAttention === 1
        ? "Your garden is healthy, but 1 plant needs attention."
        : `Your garden is healthy, but ${needsAttention} plants need attention.`;

  const rows = [
    { label: "Watering", value: health.wateringConsistency },
    { label: "Plant health", value: health.plantHealth },
    { label: "Tasks completed", value: health.tasksCompleted },
    { label: "Growth tracking", value: health.growthTracking },
  ];

  return (
    <Card padding="md" className="border-green-100">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <HealthScoreRing score={health.score} size={88} />
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-900">
            {health.score}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
            Garden Health Score
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-0.5">
            {health.score}
            <span className="text-base font-normal text-gray-400">/100</span>
          </p>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{statusLine}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-semibold text-gray-700">{row.value}%</span>
            </div>
            <MoatProgressBar value={row.value} max={100} />
          </div>
        ))}
      </div>
      {needsAttention > 0 && (
        <Link
          href="/plants"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-green-600"
        >
          Review plants <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </Card>
  );
}
