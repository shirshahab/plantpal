"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlantImage } from "@/components/plants/plant-image";
import type { Plant } from "@/lib/types";

interface AttentionItem {
  plant: Plant;
  reason: string;
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function getAttentionItems(plants: Plant[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const plant of plants) {
    if (plant.healthStatus === "critical") {
      items.push({ plant, reason: "Critical health — needs help now" });
      continue;
    }
    if (plant.healthStatus === "needs_attention") {
      items.push({ plant, reason: "Showing signs of stress" });
      continue;
    }
    const sinceWater = daysSince(plant.lastWateredAt);
    const sinceAdded = daysSince(plant.createdAt) ?? 0;
    if (sinceWater != null && sinceWater > plant.waterFrequencyDays) {
      items.push({
        plant,
        reason: `Watering overdue by ${sinceWater - plant.waterFrequencyDays} day${sinceWater - plant.waterFrequencyDays === 1 ? "" : "s"}`,
      });
    } else if (sinceWater == null && sinceAdded > plant.waterFrequencyDays) {
      items.push({ plant, reason: "No watering logged yet" });
    }
  }
  // Critical first, then stressed, then overdue
  return items.sort((a, b) => {
    const rank = (i: AttentionItem) =>
      i.plant.healthStatus === "critical"
        ? 0
        : i.plant.healthStatus === "needs_attention"
          ? 1
          : 2;
    return rank(a) - rank(b);
  });
}

export function DashboardNeedsAttention({ plants }: { plants: Plant[] }) {
  const items = getAttentionItems(plants).slice(0, 3);
  if (items.length === 0) return null;

  return (
    <Card padding="md" className="border-amber-100">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h2 className="text-base font-semibold text-gray-900">Needs attention</h2>
      </div>
      <div className="space-y-2">
        {items.map(({ plant, reason }) => (
          <Link
            key={plant.id}
            href={`/plants/${plant.id}`}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-amber-50/60 transition-colors touch-manipulation"
          >
            <PlantImage
              plant={plant}
              className="w-11 h-11 rounded-xl shrink-0"
              sizes="44px"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{plant.name}</p>
              <p className="text-xs text-amber-700">{reason}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
