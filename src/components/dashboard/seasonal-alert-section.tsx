"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, Leaf } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildLocalInsights } from "@/lib/location/location-service";
import { useWeather } from "@/lib/hooks/use-weather";
import { loadUserProfile } from "@/lib/profile/user-profile";
import type { Plant } from "@/lib/types";
import type { SeasonalTask } from "@/lib/moat/seasonal-engine";

interface DashboardSeasonalAlertProps {
  plants: Plant[];
  seasonalTasks: SeasonalTask[];
}

export function DashboardSeasonalAlert({ plants, seasonalTasks }: DashboardSeasonalAlertProps) {
  const profile = loadUserProfile();
  const zip = plants[0]?.zipCode ?? profile.zipCode ?? "91107";
  const { weather } = useWeather(zip);
  const insights = buildLocalInsights(zip, weather, plants);
  const topAlert = weather.alerts[0];
  const topSeasonal = seasonalTasks.find((t) => t.horizon === "today") ?? seasonalTasks[0];

  const message =
    topAlert?.message ??
    insights.headline ??
    (topSeasonal
      ? `${topSeasonal.title}. ${topSeasonal.description}`
      : "Check your seasonal plan for location-aware care tips.");

  const title = topAlert?.title ?? `${insights.profile.city} seasonal alert`;

  return (
    <Card padding="md" className="border-amber-100 bg-gradient-to-br from-amber-50/80 to-white">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          {topAlert ? (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          ) : (
            <Leaf className="w-5 h-5 text-green-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Seasonal alert
          </p>
          <p className="font-semibold text-gray-900 mt-1">{title}</p>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{message}</p>
          <Link href="/seasonal" className="inline-block mt-3">
            <Button variant="secondary" size="sm">
              View seasonal plan
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
