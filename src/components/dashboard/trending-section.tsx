"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
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

  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-green-600" />
        <h2 className="text-base font-semibold text-gray-900">Trending near you</h2>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Popular in {getAreaLabel(zipCode)} — tap to add one to your garden.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {trending.map((plant) => (
          <Link
            key={plant.name}
            href={trendingHref(plant)}
            className="shrink-0 w-24 text-center touch-manipulation group"
          >
            <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden bg-green-50 border-2 border-green-100 group-hover:border-green-300 transition-colors">
              {plant.imageUrl ? (
                <Image
                  src={plant.imageUrl}
                  alt={plant.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🌿</div>
              )}
            </div>
            <p className="text-xs font-medium text-gray-700 mt-1.5 leading-tight">
              {plant.name}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
