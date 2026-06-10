"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  getTrendingPlantsForZip,
  getAreaLabel,
  type TrendingPlant,
} from "@/lib/dashboard/trending-plants";
import type { Plant } from "@/lib/types";

function trendingHref(plant: TrendingPlant): string {
  if (plant.speciesId) return `/plants/new?speciesId=${encodeURIComponent(plant.speciesId)}`;
  const params = new URLSearchParams({ name: plant.name, species: plant.scientificName || plant.name });
  return `/plants/new?${params.toString()}`;
}

export function DashboardTrending({
  zipCode,
  plants,
}: {
  zipCode: string;
  plants: Plant[];
}) {
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
        Popular plants and gardening trends nearby.
      </p>
      <div className="space-y-2">
        {trending.map((plant) => (
          <Link
            key={plant.name}
            href={trendingHref(plant)}
            className="flex items-center gap-3 p-2 -mx-1 rounded-xl hover:bg-green-50/70 transition-colors touch-manipulation group"
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
              aria-label={`Add ${plant.name}`}
            >
              <Plus className="w-4 h-4" />
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
