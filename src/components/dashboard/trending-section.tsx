"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TrendingInsightModal } from "@/components/dashboard/trending-insight-modal";
import {
  getTrendingPlantsForZip,
  getAreaLabel,
  type TrendingPlant,
} from "@/lib/dashboard/trending-plants";
import type { Plant } from "@/lib/types";

export function DashboardTrending({
  zipCode,
  plants,
}: {
  zipCode: string;
  plants: Plant[];
}) {
  const [selected, setSelected] = useState<TrendingPlant | null>(null);

  if (!zipCode?.trim()) return null;
  const trending = getTrendingPlantsForZip(zipCode, plants);
  if (trending.length === 0) return null;

  const area = getAreaLabel(zipCode);
  const city = area.split(",")[0];

  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-green-600" />
        <h2 className="text-base font-semibold text-gray-900">
          Trending in {city}
        </h2>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Tap a plant to see why it&apos;s trending near you.
      </p>
      <div className="space-y-2">
        {trending.map((plant) => (
          <button
            key={plant.name}
            type="button"
            onClick={() => setSelected(plant)}
            className="w-full flex items-center gap-3 p-2 -mx-1 rounded-xl hover:bg-green-50/70 transition-colors touch-manipulation group text-left"
          >
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#eef4e3] shrink-0">
              {plant.imageUrl && (
                <Image
                  src={plant.imageUrl}
                  alt={plant.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {plant.name}
              </p>
              <p className="text-xs text-gray-500 leading-snug mt-0.5">
                {plant.reason}
              </p>
            </div>
            <span
              className="shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors"
              aria-label={`Why ${plant.name} is trending`}
            >
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <TrendingInsightModal
          plant={selected}
          zipCode={zipCode}
          onClose={() => setSelected(null)}
        />
      )}
    </Card>
  );
}
