"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  TrendingUp,
  MapPin,
  Thermometer,
  CalendarDays,
  Bug,
  Droplets,
  BookOpen,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTrendInsight,
  type TrendingPlant,
} from "@/lib/dashboard/trending-plants";

function addToGardenHref(plant: TrendingPlant): string {
  if (plant.speciesId) return `/plants/new?speciesId=${encodeURIComponent(plant.speciesId)}`;
  const params = new URLSearchParams({
    name: plant.name,
    species: plant.scientificName || plant.name,
  });
  return `/plants/new?${params.toString()}`;
}

export function TrendingInsightModal({
  plant,
  zipCode,
  onClose,
}: {
  plant: TrendingPlant;
  zipCode: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const insight = getTrendInsight(plant, zipCode);

  const rows = [
    { icon: TrendingUp, text: insight.trendStat },
    { icon: MapPin, text: insight.climateNote },
    { icon: Thermometer, text: insight.zoneNote },
    { icon: CalendarDays, text: insight.plantingSeason },
    { icon: Bug, text: `Common issues: ${insight.commonIssues}` },
    { icon: Droplets, text: `Watering: ${insight.wateringNotes}` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[88vh] overflow-y-auto safe-bottom">
        <div className="relative h-36 bg-[#eef4e3]">
          {plant.imageUrl && (
            <Image
              src={plant.imageUrl}
              alt={plant.name}
              fill
              className="object-cover"
              sizes="448px"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-gray-700 flex items-center justify-center shadow touch-manipulation"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
              Trending near you
            </p>
            <h2 className="text-xl font-bold text-gray-900">{plant.name}</h2>
            {plant.scientificName && (
              <p className="text-sm text-gray-500 italic">{plant.scientificName}</p>
            )}
          </div>

          <ul className="space-y-2.5">
            {rows.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <Icon className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700 leading-snug">{text}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push(addToGardenHref(plant))}
            >
              <Plus className="w-4 h-4" />
              Add to Garden
            </Button>
            {insight.careGuideHref && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(insight.careGuideHref!)}
              >
                <BookOpen className="w-4 h-4" />
                View Care Guide
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
